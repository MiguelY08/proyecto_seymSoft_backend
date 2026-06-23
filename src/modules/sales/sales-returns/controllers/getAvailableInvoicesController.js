// src/modules/sales/sales-returns/controllers/getAvailableInvoicesController.js

import { prisma } from '../../../../config/prisma.js';
import { evaluateSaleReturnEligibility } from '../helpers/saleReturnEligibility.js';

export const getAvailableInvoicesController = async (req, res) => {
  try {
    const { search } = req.query;

    console.log('📦 [getAvailableInvoices] search:', search || 'sin búsqueda');

    const where = {};
    
    // ✅ NO FILTRAR - mostrar TODAS (anuladas, con devolución, disponibles)
    // El frontend las deshabilitará según corresponda
    
    if (search && search.trim() !== '') {
      const term = search.trim();
      const isNumber = !isNaN(Number(term));
      
      where.OR = [];
      
      if (isNumber) {
        where.OR.push({ id_sale: Number(term) });
      }
      
      where.OR.push({
        sales_orders: {
          clients: {
            users: {
              full_name: {
                contains: term,
                mode: 'insensitive'
              }
            }
          }
        }
      });
    }

    const sales = await prisma.sales.findMany({
      where,
      take: 50,
      orderBy: { id_sale: 'desc' },
      select: {
        id_sale: true,
        id_order: true,
        id_employe: true,
        subtotal: true,
        sale_date: true,
        id_sale_status: true,
        sale_statuses: {
          select: {
            name_status: true
          }
        },
        employees: {
          select: {
            users: {
              select: {
                full_name: true
              }
            }
          }
        },
        sales_orders: {
          select: {
            id_customer: true,
            total: true,
            hev: {
              select: {
                status_date: true
              }
            },
            clients: {
              select: {
                id_client: true,
                contact_person_number: true,
                address: true,
                users: {
                  select: {
                    full_name: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        // ✅ IMPORTANTE: Incluir sales_returns para saber si tiene devolución
        sales_returns: {
          select: {
            id_sales_return: true
          }
        }
      }
    });

    console.log('📦 [getAvailableInvoices] Ventas encontradas:', sales.length);

    const invoices = sales.map(sale => {
      try {
        const order = sale.sales_orders;
        const client = order?.clients;
        const clientUser = client?.users;
        const employee = sale.employees;
        const employeeUser = employee?.users;

        const clientPhone = clientUser?.phone || client?.contact_person_number || null;
        const phoneString = clientPhone !== null ? String(clientPhone) : null;

        // ✅ DETECTAR SI TIENE DEVOLUCIÓN
        const hasReturn = (sale.sales_returns?.length || 0) > 0;
        
        // ✅ DETECTAR SI ESTÁ ANULADA
        const isAnnulled = sale.id_sale_status === 4;
        const eligibility = evaluateSaleReturnEligibility(sale);

        return {
          idSale: sale.id_sale,
          invoiceNumber: String(sale.id_sale),
          clientName: clientUser?.full_name || '',
          clientId: order?.id_customer || null,
          clientPhone: phoneString,
          clientAddress: client?.address || '',
          employeeName: employeeUser?.full_name || '',
          saleDate: sale.sale_date,
          subtotal: Number(sale.subtotal || 0),
          total: Number(order?.total || sale.subtotal || 0),
          hasReturn: hasReturn,      // ✅ PARA DESHABILITAR EN FRONTEND
          isAnnulled: isAnnulled,    // ✅ PARA DESHABILITAR EN FRONTEND
          statusId: sale.id_sale_status,
          statusName: sale.sale_statuses?.name_status || '',
          canReturn: eligibility.canReturn && !hasReturn && !isAnnulled,
          returnBlockReason: eligibility.reason,
          deliveredAt: eligibility.deliveredAt,
          daysSinceDelivery: eligibility.daysSinceDelivery,
          remainingReturnDays: eligibility.remainingDays
        };
      } catch (mapError) {
        console.error('📦 [getAvailableInvoices] Error mapeando venta:', sale.id_sale, mapError);
        return null;
      }
    }).filter(invoice => invoice !== null);

    return res.status(200).json({
      success: true,
      data: invoices,
      total: invoices.length
    });

  } catch (error) {
    console.error('[getAvailableInvoicesController] Error:', error);
    
    if (error.code === 'P1001' || error.code === 'P1002' || error.message.includes('connect')) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
        message: 'Error de conexión a la base de datos, intenta de nuevo'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo facturas disponibles',
      error: error.message
    });
  }
};
