import { prisma } from '../../../../config/prisma.js';

const monthNamesMap = {
  'Ene': 'Enero', 'Feb': 'Febrero', 'Mar': 'Marzo', 'Abr': 'Abril',
  'May': 'Mayo', 'Jun': 'Junio', 'Jul': 'Julio', 'Ago': 'Agosto',
  'Sep': 'Septiembre', 'Oct': 'Octubre', 'Nov': 'Noviembre', 'Dic': 'Diciembre'
};

export const getClientPurchasesUseCase = async (clientId) => {
  try {
    const orders = await prisma.sales_orders.findMany({
      where: { id_customer: clientId },
      select: { order_date: true, total: true },
      orderBy: { order_date: 'asc' }
    });

    if (!orders.length) {
      return {
        success: true,
        data: { byMonth: [], total: 0, firstPurchase: null, lastPurchase: null }
      };
    }

    const byMonth = {};
    orders.forEach(order => {
      if (!order.order_date) return;
      
      const date = new Date(order.order_date);
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const key = `${month}-${year}`;
      
      if (!byMonth[key]) {
        byMonth[key] = { month, monthFull: monthNamesMap[month], year, total: 0, count: 0 };
      }
      byMonth[key].total += Number(order.total || 0);
      byMonth[key].count += 1;
    });

    const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const firstPurchase = orders[0]?.order_date || null;
    const lastPurchase = orders[orders.length - 1]?.order_date || null;

    return {
      success: true,
      data: { byMonth: Object.values(byMonth), total, firstPurchase, lastPurchase }
    };
  } catch (error) {
    console.error('Error en getClientPurchasesUseCase:', error);
    return { success: false, error: error.message };
  }
};