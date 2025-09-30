import { db } from '../../db';
import { inventoryItems, inventoryRequests, jobHistory, users } from '../../db/schema';
import { sql, eq, gte, desc } from 'drizzle-orm';

export async function getEmployeeProductivity() {
  // คำนวณวันที่ย้อนหลังไป 30 วัน
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Query เพื่อนับจำนวนงานที่เสร็จ (completed) แยกตามพนักงานในช่วง 30 วัน
  const productivityData = await db
    .select({
      employeeName: users.name,
      completedJobs: sql<number>`count(${jobHistory.id})`.mapWith(Number),
    })
    .from(jobHistory)
    .innerJoin(users, eq(jobHistory.employeeId, users.id))
    .where(gte(jobHistory.completedAt, thirtyDaysAgo)) // กรองเฉพาะ 30 วันล่าสุด
    .groupBy(users.name)
    .orderBy(sql`count(${jobHistory.id}) DESC`); // เรียงจากคนที่ทำเสร็จมากสุด

  return productivityData;
}

// Service สำหรับดึง 5 อันดับอุปกรณ์ที่ถูกเบิกใช้มากที่สุด (เวอร์ชันปรับปรุง)
export async function getTopInventoryItems() {
  const topItems = await db
    .select({
      itemName: inventoryItems.name,
      // ✅ 1. เพิ่มคอลัมน์นี้เพื่อดึงจำนวนคงเหลือปัจจุบัน
      remainingQuantity: inventoryItems.quantity,
      totalRequested: sql<number>`sum(${inventoryRequests.quantity})`.mapWith(Number),
    })
    .from(inventoryRequests)
    .innerJoin(inventoryItems, eq(inventoryRequests.itemId, inventoryItems.id))
    .where(eq(inventoryRequests.status, 'approved'))
    // ✅ 2. ต้องเพิ่ม quantity เข้าไปใน groupBy ด้วย
    .groupBy(inventoryItems.name, inventoryItems.quantity)
    .orderBy(desc(sql<number>`sum(${inventoryRequests.quantity})`))
    .limit(5);

  return topItems;
}

// Service สำหรับดึงข้อมูลแนวโน้มงานที่เสร็จสิ้น (เวอร์ชันแก้ไข)
export async function getCompletedJobsTrend(period: 'day' | 'month' | 'year') {
  const completedAtCol = sql.identifier('completed_at');

  // map period -> format ที่ใช้กับ date_trunc
  const truncUnit =
    period === 'day' ? sql`'day'` :
    period === 'month' ? sql`'month'` :
    sql`'year'`;

  // กำหนด format string ของ to_char ตาม period
  const format =
    period === 'day' ? 'YYYY-MM-DD' :
    period === 'month' ? 'YYYY-MM' :
    'YYYY';

  const dateTruncFragment = sql`DATE_TRUNC(${truncUnit}, ${completedAtCol})`;
  const toCharFragment = sql`TO_CHAR(${dateTruncFragment}, ${format})`;

  const trendData = await db
    .select({
      date: toCharFragment,
      count: sql<number>`COUNT(${jobHistory.id})`.mapWith(Number),
    })
    .from(jobHistory)
    .groupBy(dateTruncFragment)
    .orderBy(dateTruncFragment);

  return trendData;
}
