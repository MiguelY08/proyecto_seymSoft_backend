import { prisma } from '../../../../config/prisma.js';

export const getClientFinancialSummaryUseCase = async (clientId) => {
  try {
    // 1. Obtener el cliente
    const client = await prisma.clients.findUnique({
      where: { id_client: clientId },
      select: {
        id_client: true,
        credit: true,
        credit_balance: true,
        users: {
          select: {
            full_name: true,
            phone: true,
          }
        }
      }
    });

    if (!client) {
      return { success: false, error: 'Cliente no encontrado' };
    }

    // 2. Obtener créditos del cliente
    const credits = await prisma.credits.findMany({
      where: {
        id_customer: clientId,
      },
      include: {
        credit_interests: true,
        installments: {
          where: {
            is_cancelled: false,
          },
        },
        sales: true,
        credit_statuses: true,
      },
      orderBy: {
        due_date: 'asc',
      },
    });

    // 3. Calcular totales
    const totalDebt = credits.reduce(
      (total, credit) => total + Number(credit.remaining_balance || 0),
      0
    );

    const activeCredits = credits.filter(
      (credit) => Number(credit.remaining_balance || 0) > 0
    );

    const usedCredit = activeCredits.reduce(
      (total, credit) => total + Number(credit.remaining_balance || 0),
      0
    );

    const assignedCredit = Number(client.credit || 0);
    const availableCredit = Math.max(0, assignedCredit - usedCredit);
    const saldoFavor = Number(client.credit_balance || 0);

    // 4. Calcular días de mora
    const calculateOverdueDays = (dueDate) => {
      if (!dueDate) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      const diffTime = today - due;
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    };

    let status = 'AL_DIA';
    const hasOverdueCredit = activeCredits.some(
      (credit) => calculateOverdueDays(credit.due_date) > 0
    );

    if (hasOverdueCredit) {
      status = 'VENCIDO';
    } else if (activeCredits.length > 0) {
      status = 'PENDIENTE';
    }

    // 5. Mapear créditos activos
    const creditosActivosList = activeCredits.map(credit => ({
      id: credit.id_credit,
      idSale: credit.id_sale,
      monto: Number(credit.credit_amount || 0),
      saldoPendiente: Number(credit.remaining_balance || 0),
      fechaVencimiento: credit.due_date,
      estado: credit.credit_statuses?.name_credit_status || 'Pendiente',
      estadoId: credit.id_credit_status,
    }));

    return {
      success: true,
      data: {
        idClient: client.id_client,
        fullName: client.users?.full_name || '',
        phone: client.users?.phone ? String(client.users.phone) : '',
        assignedCredit,
        usedCredit,
        availableCredit,
        totalDebt,
        activeCreditsCount: activeCredits.length,
        saldoFavor,
        status,
        creditos: creditosActivosList,
      }
    };
  } catch (error) {
    console.error('Error en getClientFinancialSummaryUseCase:', error);
    return { success: false, error: error.message };
  }
};