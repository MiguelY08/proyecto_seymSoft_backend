import { prisma } from "../../../../config/prisma.js";
import { CREDIT_STATUS } from "../constants/creditStatus.constants.js";

export class PaymentsRepository {
  constructor() {
    this.prisma = prisma;
  }

  // =====================================================
  // CONSULTAS
  // =====================================================

  /**
   * Obtiene todos los clientes con creditos.
   */
  async getCreditCustomers() {
    return this.prisma.clients.findMany({
      where: {
        credits: {
          some: {},
        },
      },

      select: {
        id_client: true,
        doc_number: true,
        credit: true,

        users: {
          select: {
            full_name: true,
            phone: true,
          },
        },

        credits: {
          select: {
            remaining_balance: true,
            due_date: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene todos los creditos de un cliente.
   */
  async getCustomerCredits(id_customer) {
    return this.prisma.credits.findMany({
      where: {
        id_customer,
      },

      select: {
        id_credit: true,
        id_sale: true,
        credit_amount: true,
        remaining_balance: true,
        due_date: true,

        clients: {
          select: {
            id_client: true,

            users: {
              select: {
                full_name: true,
                phone: true,
              },
            },
          },
        },

        sales: {
          select: {
            sale_date: true,
          },
        },

        credit_interests: {
          select: {
            generated_amount: true,
          },
        },

        installments: {
          where: {
            is_cancelled: false,
          },

          select: {
            installment_amount: true,
            interest_paid: true,
            installment_date: true,
          },
        },
      },

      orderBy: {
        due_date: "asc",
      },
    });
  }

  /**
   * Obtiene un credito por id.
   */
  async getCreditById(id_credit) {
    return this.prisma.credits.findUnique({
      where: {
        id_credit,
      },

      select: {
        id_credit: true,
        id_customer: true,
        remaining_balance: true,
        due_date: true,

        credit_interests: {
          select: {
            generated_amount: true,
          },
        },

        installments: {
          select: {
            interest_paid: true,
          },

          orderBy: {
            installment_date: "desc",
          },
        },
      },
    });
  }

  /**
   * Obtiene historial de abonos.
   */
  async getInstallmentsByCredit(id_credit) {
    return this.prisma.installments.findMany({
      where: {
        id_credit,
      },

      select: {
        id_installment: true,
        installment_amount: true,
        capital_paid: true,
        interest_paid: true,
        created_at: true,
        installment_date: true,
        observations: true,
        is_cancelled: true,
        cancelled_at: true,
        cancellation_reason: true,

        payment_methods: {
          select: {
            id_payment_method: true,
            name_payment_method: true,
          },
        },

        registered_by_user: {
          select: {
            id_user: true,
            full_name: true,
          },
        },

        cancelled_by_user: {
          select: {
            id_user: true,
            full_name: true,
          },
        },
      },

      orderBy: {
        installment_date: "desc",
      },
    });
  }

  /**
   * Obtiene intereses de un credito.
   */
  async getCreditInterests(id_credit) {
    return this.prisma.credit_interests.findMany({
      where: {
        id_credit,
      },

      orderBy: {
        created_at: "asc",
      },
    });
  }

  /**
   * Obtiene metodos de pago validos para abonos.
   */
  async getPaymentMethods() {
    return this.prisma.payment_methods.findMany({
      where: {
        NOT: {
          name_payment_method: "Crédito",
        },
      },

      orderBy: {
        name_payment_method: "asc",
      },
    });
  }

  /**
   * Obtiene catalogo de estados.
   */
  async getCreditStatuses() {
    return this.prisma.credit_statuses.findMany({
      orderBy: {
        id_credit_status: "asc",
      },
    });
  }

  /**
   * Obtiene un estado por nombre.
   */
  async getCreditStatusByName(name_credit_status) {
    return this.prisma.credit_statuses.findFirst({
      where: {
        name_credit_status,
      },
    });
  }

  /**
   * Obtiene mapa de estados.
   */
  async getCreditStatusesMap() {
    const statuses =
      await this.prisma.credit_statuses.findMany({
        select: {
          id_credit_status: true,
          name_credit_status: true,
        },
      });

    return {
      pending: statuses.find(
        (status) =>
          status.name_credit_status === CREDIT_STATUS.PENDING
      )?.id_credit_status,

      paid: statuses.find(
        (status) =>
          status.name_credit_status === CREDIT_STATUS.PAID
      )?.id_credit_status,

      overdue: statuses.find(
        (status) =>
          status.name_credit_status === CREDIT_STATUS.OVERDUE
      )?.id_credit_status,
    };
  }

  /**
   * Obtiene un cliente.
   */
  async getClientById(id_customer) {
    return this.prisma.clients.findUnique({
      where: {
        id_client: id_customer,
      },

      select: {
        id_client: true,
        credit_balance: true,
        users: {
          select: {
            id_user: true,
            full_name: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene un credito a partir de una venta.
   */
  async getCreditBySaleId(id_sale) {
    return this.prisma.credits.findFirst({
      where: {
        id_sale,
      },

      select: {
        id_credit: true,

        installments: {
          select: {
            id_installment: true,
            installment_amount: true,
            capital_paid: true,
            interest_paid: true,
            created_at: true,
            installment_date: true,
            observations: true,
            is_cancelled: true,
            cancelled_at: true,
            cancellation_reason: true,

            payment_methods: {
              select: {
                id_payment_method: true,
                name_payment_method: true,
              },
            },

            registered_by_user: {
              select: {
                id_user: true,
                full_name: true,
              },
            },

            cancelled_by_user: {
              select: {
                id_user: true,
                full_name: true,
              },
            },
          },

          orderBy: {
            installment_date: "desc",
          },
        },
      },
    });
  }

  /**
   * Obtiene un abono especifico.
   */
  async getInstallmentById(id_installment) {
    return this.prisma.installments.findUnique({
      where: {
        id_installment,
      },

      select: {
        id_installment: true,
        is_cancelled: true,
        created_at: true,
        installment_date: true,
        capital_paid: true,

        credits: {
          select: {
            id_credit: true,
            remaining_balance: true,
            due_date: true,

            clients: {
              select: {
                id_client: true,
                credit_balance: true,
              },
            },
          },
        },
      },
    });
  }

  // =====================================================
  // TRANSACCIONES DE NEGOCIO
  // =====================================================

  /**
   * Procesa un abono.
   *
   * - Crea el abono.
   * - Actualiza saldo del credito.
   * - Actualiza estado del credito.
   * - Libera cupo al cliente.
   */
  async processInstallment({
    installmentData,
    id_credit,
    remaining_balance,
    id_credit_status,

    id_customer,
    credit_balance,
  }) {
    return this.prisma.$transaction(async (tx) => {
      const installment = await tx.installments.create({
        data: installmentData,
        include: {
          payment_methods: true,
          registered_by_user: {
            select: {
              id_user: true,
              full_name: true,
            },
          },
          cancelled_by_user: {
            select: {
              id_user: true,
              full_name: true,
            },
          },
        },
      });

      await tx.credits.update({
        where: {
          id_credit,
        },

        data: {
          remaining_balance,
          id_credit_status,
        },
      });

      await tx.clients.update({
        where: {
          id_client: id_customer,
        },

        data: {
          credit_balance,
        },
      });

      return installment;
    });
  }

  /**
   * Anula un abono.
   *
   * - Marca el abono como anulado.
   * - Revierte saldo del credito.
   * - Revierte cupo liberado.
   * - Actualiza estado.
   */
  async cancelInstallmentTransaction({
    id_installment,

    cancelled_at,
    cancellation_reason,
    cancelled_by,

    id_credit,
    remaining_balance,
    id_credit_status,

    id_customer,
    credit_balance,
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.installments.update({
        where: {
          id_installment,
        },

        data: {
          is_cancelled: true,
          cancelled_at,
          cancellation_reason,
          cancelled_by,
        },
      });

      await tx.credits.update({
        where: {
          id_credit,
        },

        data: {
          remaining_balance,
          id_credit_status,
        },
      });

      await tx.clients.update({
        where: {
          id_client: id_customer,
        },

        data: {
          credit_balance,
        },
      });
    });
  }

  /**
   * Registra un nuevo interes.
   */
  async createInterestTransaction(interestData) {
    return this.prisma.$transaction(async (tx) => {
      return tx.credit_interests.create({
        data: interestData,
      });
    });
  }

  async getUserById(id_user) {
    return this.prisma.users.findUnique({
      where: {
        id_user,
      },

      select: {
        id_user: true,
        full_name: true,
        pass_word: true,
      },
    });
  }

  async getPaymentNotificationContext({
    id_credit,
    actorUserId,
  }) {
    const [credit, actorUser, adminUsers] =
      await Promise.all([
        this.prisma.credits.findUnique({
          where: {
            id_credit,
          },
          select: {
            id_credit: true,
            remaining_balance: true,
            due_date: true,
            clients: {
              select: {
                id_client: true,
                users: {
                  select: {
                    id_user: true,
                    full_name: true,
                  },
                },
              },
            },
          },
        }),

        actorUserId
          ? this.prisma.users.findUnique({
              where: {
                id_user: actorUserId,
              },
              select: {
                id_user: true,
                full_name: true,
                employees: {
                  select: {
                    employee_roles: {
                      select: {
                        assigned_permissions: {
                          select: {
                            roles: {
                              select: {
                                id_role: true,
                                name_role: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            })
          : null,

        this.prisma.users.findMany({
          where: {
            id_status: 1,
            employees: {
              employee_roles: {
                assigned_permissions: {
                  roles: {
                    name_role: "Administrator",
                  },
                },
              },
            },
          },
          select: {
            id_user: true,
            full_name: true,
          },
        }),
      ]);

    const actorRole =
      actorUser
        ?.employees
        ?.employee_roles
        ?.assigned_permissions
        ?.roles || null;

    return {
      credit,
      clientUser: credit?.clients?.users || null,
      actorUser: actorUser
        ? {
            id_user: actorUser.id_user,
            full_name: actorUser.full_name,
            role: actorRole,
          }
        : null,
      adminUsers,
    };
  }

  async findOverdueCreditsPendingNotification(currentDate) {
    return this.prisma.credits.findMany({
      where: {
        remaining_balance: {
          gt: 0,
        },
        due_date: {
          lt: currentDate,
        },
        overdue_notification_sent_at: null,
      },
      select: {
        id_credit: true,
        due_date: true,
        remaining_balance: true,
      },
      orderBy: {
        due_date: "asc",
      },
    });
  }

  async markOverdueCreditNotificationSent(id_credit, sentAt) {
    return this.prisma.credits.update({
      where: {
        id_credit,
      },
      data: {
        overdue_notification_sent_at: sentAt,
      },
      select: {
        id_credit: true,
        overdue_notification_sent_at: true,
      },
    });
  }
}
