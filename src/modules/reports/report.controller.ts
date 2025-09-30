import { FastifyRequest } from 'fastify';
import { getCompletedJobsTrend, getEmployeeProductivity, getTopInventoryItems } from './report.service';

export async function getEmployeeProductivityHandler() {
  const data = await getEmployeeProductivity();
  return data;
}

// Handler สำหรับดึง Top 5 Items
export async function getTopItemsHandler() {
  const data = await getTopInventoryItems();
  return data;
}

// Handler สำหรับดึงข้อมูล Trend
export async function getCompletedJobsTrendHandler(
  request: FastifyRequest<{ Querystring: { period: 'day' | 'month' | 'year' } }>
) {
  const { period } = request.query;
  const data = await getCompletedJobsTrend(period);
  return data;
}