/**
 * Repository: PaymentsRepository
 * Responsibility: Data access for payments-related entities (invoices, installments, etc.).
 */
import prisma from "../../src/config/prisma.js";

export default class PaymentsRepository {

// obtener clientes con créditos activos y sus detalles relacionados (ventas, cuotas, intereses)
    async getCreditCustomers() {
    return prisma.clients.findMany({
      where: {
        credits: {
          some: {}
        }
      },

      include: {
        users: true,

        credits: {
          include: {
            sales: true,

            installments: {
              where: {
                is_cancelled: false
              }
            },

            credit_interests: true
          }
        }
      }
    });
  }

// ver informacion detallada de un cliente específico, incluyendo sus créditos, ventas, cuotas e intereses
  async getCustomerCredits(id_customer) {
    return prisma.credits.findMany({
      where: {
        id_customer
      },

      include: {
        sales: true,

        installments: {
          where: {
            is_cancelled: false
          }
        },

        credit_interests: true
      }
    });
  }

// obtener información detallada de un crédito específico, incluyendo su venta asociada, cuotas pendientes e intereses generados
  async getCreditById(id_credit) {
    return prisma.credits.findUnique({
      where: {
        id_credit
      },

      include: {
        sales: true,

        installments: true,

        credit_interests: true,

        clients: {
          include: {
            users: true
          }
        }
      }
    });
  }

// historial de pagos realizados para un crédito específico, incluyendo detalles de cada cuota pagada y los intereses asociados a cada pago

  async getInstallmentsByCredit(id_credit) {
    return prisma.installments.findMany({
        where: {
          id_credit
        },

        include: {
          payment_methods: true
        },

        orderBy: {
          installment_date: 'desc'
        }
      });
    
  }

  async createInstallment(data) {
    return prisma.installments.create({
      data
    });
  }

  // cancelar una cuota específica, marcándola como cancelada y registrando la fecha de cancelación
  async cancelInstallment(id_installment) {
    return prisma.installments.update({
      where: {
        id_installment
      },

      data: {
        is_cancelled: true,
        cancelled_at: new Date()
      }
    });
  }

    // registrar un nuevo interés generado para un crédito específico, incluyendo el monto del interés, la fecha de generación y el porcentaje aplicado
  async createInterest(data) {
    return prisma.credit_interests.create({
      data
    });
  }

  // contactar al cliente para recordarle el pago pendiente, utilizando la información de contacto almacenada en la base de datos (correo electrónico, teléfono, etc.)
    async getCustomerLastPayment(id_customer) {
      return prisma.installments.findFirst({
        where: {
          credits: {
            id_customer
          },

          is_cancelled: false
        },

        orderBy: {
          installment_date: 'desc'
        }
      });
    }

    async getOverdueCreditsByCustomer(id_customer) {
      return prisma.credits.findMany({
        where: {
          id_customer
        },

        include: {
          sales: true,

          installments: {
            where: {
              is_cancelled: false
            }
          },

          credit_interests: true
        }
      });
    }
}
