import { PurchaseReturnRepository } from "../repositories/purchaseReturnRepository.js";

const buildWhere = ({
  search,
  idPurchase,
  idReturnStatus,
  startDate,
  endDate,
}) => {
  const searchTerm =
    search?.trim();

  return {
    ...(idPurchase && {
      id_purchase:
        Number(idPurchase),
    }),

    ...(idReturnStatus && {
      id_return_status:
        Number(idReturnStatus),
    }),

    ...((startDate || endDate) && {
      creation_date: {
        ...(startDate && {
          gte: startDate,
        }),
        ...(endDate && {
          lte: endDate,
        }),
      },
    }),

    ...(searchTerm && {
      OR: [
        {
          purchases: {
            invoice_number: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
        {
          purchases: {
            providers: {
              name_provider: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
        },
        {
          return_statuses: {
            name_status: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    }),
  };
};

const buildOrderBy = ({
  sortBy = "creationDate",
  order = "desc",
}) => {
  const normalizedOrder =
    order === "asc" ? "asc" : "desc";

  const orderByByField = {
    creationDate: {
      creation_date: normalizedOrder,
    },
    invoiceNumber: {
      purchases: {
        invoice_number: normalizedOrder,
      },
    },
    status: {
      return_statuses: {
        name_status: normalizedOrder,
      },
    },
  };

  return orderByByField[sortBy] ||
    orderByByField.creationDate;
};

export const getAllPurchaseReturnsUseCase = async (filters = {}) => {
  try {
    const page =
      Number(filters.page || 1);

    const limit =
      Number(filters.limit || 10);

    const skip =
      (page - 1) * limit;

    const where =
      buildWhere(filters);

    const orderBy =
      buildOrderBy(filters);

    const result =
      await PurchaseReturnRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy,
      });

    if (!result || !Array.isArray(result.items)) {
      return {
        success: false,
        data: null,
        error: "Respuesta invalida del repositorio.",
        errorCode: "INVALID_REPOSITORY_RESPONSE",
      };
    }

    const total =
      Number(result.total || 0);

    const totalPages =
      Math.ceil(total / limit);

    return {
      success: true,
      data: {
        items: result.items,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      error: null,
      errorCode: null,
    };

  } catch (error) {
    console.error(
      "[GetAllPurchaseReturnsUseCase]",
      error
    );

    return {
      success: false,
      data: null,
      error: "Error al obtener las devoluciones de compra.",
      errorCode: "DATABASE_ERROR",
    };
  }
};

export const getAll =
  getAllPurchaseReturnsUseCase;
