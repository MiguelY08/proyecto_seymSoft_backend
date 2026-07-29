import { prisma } from '../../../../config/prisma.js';
import calculateOverdueDays from '../../payments/helpers/calculateOverdueDays.js';
import calculatePendingInterest from '../../payments/helpers/calculatePendingInterest.js';

const toNumber = (value) => Number(value || 0);

const getPendingInterest = (credit) => {
  const generatedInterest = credit.credit_interests.reduce(
    (total, interest) => total + toNumber(interest.generated_amount),
    0
  );

  const paidInterest = credit.installments.reduce(
    (total, installment) => total + toNumber(installment.interest_paid),
    0
  );

  return calculatePendingInterest({
    generatedInterest,
    paidInterest,
  });
};

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
      (total, credit) =>
        total + toNumber(credit.remaining_balance) + getPendingInterest(credit),
      0
    );

    const activeCredits = credits.filter(
      (credit) => toNumber(credit.remaining_balance) > 0
    );

    const usedCredit = activeCredits.reduce(
      (total, credit) => total + toNumber(credit.remaining_balance),
      0
    );

    const assignedCredit = toNumber(client.credit);
    const availableCredit = Math.max(0, assignedCredit - usedCredit);
    const saldoFavor = toNumber(client.credit_balance);

    // 4. Calcular días de mora
    let status = 'AL_DIA';
    const hasOverdueCredit = activeCredits.some(
      (credit) => calculateOverdueDays({ dueDate: credit.due_date }) > 0
    );

    if (hasOverdueCredit) {
      status = 'VENCIDO';
    } else if (activeCredits.length > 0) {
      status = 'PENDIENTE';
    }

    // 5. Mapear créditos activos
    const creditosActivosList = activeCredits.map(credit => {
      const pendingCapital = toNumber(credit.remaining_balance);
      const pendingInterest = getPendingInterest(credit);

      return {
        id: credit.id_credit,
        idSale: credit.id_sale,
        monto: toNumber(credit.credit_amount),
        saldoPendiente: pendingCapital + pendingInterest,
        capitalPendiente: pendingCapital,
        interesPendiente: pendingInterest,
        fechaVencimiento: credit.due_date,
        estado: credit.credit_statuses?.name_credit_status || 'Pendiente',
        estadoId: credit.id_credit_status,
      };
    });

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
