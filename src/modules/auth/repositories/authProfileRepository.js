import { prisma } from "../../../config/prisma.js";

export class AuthProfileRepository {
  constructor() {
    this.prisma = prisma;
  }

  async findSummaryByUserId(idUser) {
    return this.prisma.users.findUnique({
      where: {
        id_user: idUser,
      },
      select: {
        id_user: true,
        full_name: true,
        email: true,
        clients: {
          select: {
            id_client: true,
            credit: true,
            credit_balance: true,
            credits: {
              where: {
                remaining_balance: {
                  gt: 0,
                },
              },
              select: {
                id_credit: true,
                remaining_balance: true,
                due_date: true,
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
                    interest_paid: true,
                  },
                },
              },
              orderBy: {
                due_date: "asc",
              },
            },
          },
        },
        employees: {
          select: {
            employee_roles: {
              select: {
                roles: {
                  select: {
                    name_role: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
