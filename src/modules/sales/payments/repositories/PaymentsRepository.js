import { prisma } from "../../../../config/prisma.js";
import { CREDIT_STATUS } from "../constants/creditStatus.constants.js";

export class PaymentsRepository {
  constructor() {
    this.prisma = prisma;
  }

  async getCreditCustomers() {
    return this.prisma.clients.findMany({
      where: {
        credits: {
          some: {},
        },
      },
      include: {
        users: true,
        credits: {
          include: {
            credit_interests: true,
            installments: {
              where: {
                is_cancelled: false,
              },
            },
          },
        },
      },
    });
  }

  async getCustomerCredits(id_customer) {
    return this.prisma.credits.findMany({
      where: {
        id_customer,
      },
      include: {
        clients: {
          include: {
            users: true,
          },
        },
        sales: true,
        credit_statuses: true,
        credit_interests: true,
        installments: {
          where: {
            is_cancelled: false,
          },
        },
      },
      orderBy: {
        due_date: "asc",
      },
    });
  }

  async getCreditById(id_credit) {
    return this.prisma.credits.findUnique({
      where: {
        id_credit,
      },
      include: {
        clients: {
          include: {
            users: true,
          },
        },
        sales: true,
        credit_statuses: true,
        credit_interests: true,
        installments: {
          include: {
            payment_methods: true,
          },
          orderBy: {
            installment_date: "desc",
          },
        },
      },
    });
  }

  async getInstallmentsByCredit(id_credit) {
    return this.prisma.installments.findMany({
      where: {
        id_credit,
      },
      include: {
        payment_methods: true,
        users: {
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

  async getInstallmentById(id_installment) {
    return this.prisma.installments.findUnique({
      where: {
        id_installment,
      },
      include: {
        payment_methods: true,
        users: {
          select: {
            id_user: true,
            full_name: true,
          },
        },
        credits: {
          include: {
            clients: {
              include: {
                users: true,
              },
            },
            credit_interests: true,
          },
        },
      },
    });
  }

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

  async getCreditStatuses() {
    return this.prisma.credit_statuses.findMany({
      orderBy: {
        id_credit_status: "asc",
      },
    });
  }

  async getCreditStatusByName(
    name_credit_status
  ) {
    return this.prisma.credit_statuses.findFirst({
      where: {
        name_credit_status,
      },
    });
  }

  async getCreditStatusesMap() {
    const statuses =
      await this.prisma.credit_statuses.findMany();

    return {
      pending:
        statuses.find(
          (status) =>
            status.name_credit_status ===
            CREDIT_STATUS.PENDING
        )?.id_credit_status,
      paid:
        statuses.find(
          (status) =>
            status.name_credit_status ===
            CREDIT_STATUS.PAID
        )?.id_credit_status,
      overdue:
        statuses.find(
          (status) =>
            status.name_credit_status ===
            CREDIT_STATUS.OVERDUE
        )?.id_credit_status,
    };
  }

  async getClientById(id_customer) {
    return this.prisma.clients.findUnique({
      where: {
        id_client: id_customer,
      },
      include: {
        users: true,
      },
    });
  }

  async getCreditBySaleId(id_sale) {
    return this.prisma.credits.findFirst({
      where: {
        id_sale,
      },
      include: {
        sales: true,
        clients: {
          include: {
            users: true,
          },
        },
        installments: {
          include: {
            payment_methods: true,
            users: {
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

  async processInstallment({
    installmentData,
    id_credit,
    remaining_balance,
    id_credit_status,
    id_customer,
    credit_balance,
  }) {
    return this.prisma.$transaction(
      async (tx) => {
        const installment =
          await tx.installments.create({
            data: installmentData,
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
      }
    );
  }

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
    return this.prisma.$transaction(
      async (tx) => {
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
      }
    );
  }

  async createInterestTransaction(
    interestData
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        return tx.credit_interests.create({
          data: interestData,
        });
      }
    );
  }

  async getUserById(id_user) {
    return this.prisma.users.findUnique({
      where: {
        id_user,
      },
    });
  }
}
