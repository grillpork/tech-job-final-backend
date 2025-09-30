// /scripts/seed.ts

import 'dotenv/config';
import { db } from '../src/db';
import {
  users,
  positions,
  inventoryItems,
  jobs,
  assignments,
  jobHistory,
} from '../src/db/schema';
import { hashPassword } from '../src/utils/password.utils';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

// Helper function to get a random item from an array
const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // --- 1. SEED USERS (from previous script) ---
    console.log('👤 Checking/creating users...');
    const adminEmail = 'admin@example.com';
    let admin = await db.query.users.findFirst({ where: (user, { eq }) => eq(user.email, adminEmail) });

    if (!admin) {
      const adminPasswordHash = await hashPassword('AdminPassword123!');
      [admin] = await db.insert(users).values({
        name: 'Admin User',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: 'admin',
      }).returning();
      console.log(`✅ Created admin user: ${adminEmail}`);
    } else {
      console.log('🔵 Admin user already exists.');
    }

    const employeeCount = await db.select({ count: sql<number>`count(*)` }).from(users).where(sql`${users.role} = 'employee'`);
    if (employeeCount[0].count < 20) {
        // Create employees if not enough exist
        const newEmployees = [];
        const commonPassword = 'Password123!';
        const hashedPassword = await hashPassword(commonPassword);
        for (let i = 0; i < 20; i++) {
            newEmployees.push({
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                passwordHash: hashedPassword,
                role: 'employee' as const,
            });
        }
        await db.insert(users).values(newEmployees).onConflictDoNothing();
        console.log(`✅ Created 20 new employees.`);
    } else {
        console.log('🔵 Employee users already exist.');
    }
    
    // --- 2. FETCH IDs FOR RELATIONS ---
    const allEmployeeUsers = await db.query.users.findMany({ where: (user, { eq }) => eq(user.role, 'employee') });
    if (allEmployeeUsers.length === 0) throw new Error("No employees found to assign jobs to.");

    // --- 3. SEED POSITIONS ---
    console.log('🏷️ Seeding positions...');
    const positionNames = ['Field Engineer', 'System Technician', 'Maintenance Specialist', 'Network Installer'];
    const newPositions = positionNames.map(name => ({ name }));
    await db.insert(positions).values(newPositions).onConflictDoNothing();
    const allPositions = await db.query.positions.findMany();
    console.log(`✅ Positions seeded.`);

    // --- 4. SEED INVENTORY ---
    console.log('📦 Seeding inventory items...');
    const inventoryData = [
      { name: 'สว่านไฟฟ้า Bosch (ยืม-คืน)', quantity: 5, type: 'reusable' as const },
      { name: 'บันไดอลูมิเนียม 5 เมตร (ยืม-คืน)', quantity: 10, type: 'reusable' as const },
      { name: 'เครื่องวัดสัญญาณ (ยืม-คืน)', quantity: 3, type: 'reusable' as const },
      { name: 'สกรูเกลียวปล่อย (ใช้แล้วหมดไป)', quantity: 2000, type: 'consumable' as const },
      { name: 'สาย LAN CAT6 100 เมตร (ใช้แล้วหมดไป)', quantity: 50, type: 'consumable' as const },
      { name: 'น้ำมันหล่อลื่น (ใช้แล้วหมดไป)', quantity: 20, type: 'consumable' as const },
    ];
    await db.insert(inventoryItems).values(inventoryData).onConflictDoNothing();
    console.log('✅ Inventory items seeded.');
    
    // --- 5. SEED JOBS, ASSIGNMENTS, and HISTORY ---
    console.log('📝 Seeding jobs, assignments, and histories...');
    const jobStatuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
    const departments = ['Maintenance', 'Installation', 'IT Support', 'Networking'];
    const newJobs = [];
    const newAssignments = [];
    const newHistories = [];
    const NUM_JOBS = 50;

    for (let i = 0; i < NUM_JOBS; i++) {
      const status = getRandomItem(jobStatuses);
      const jobDate = faker.date.between({ from: new Date('2025-08-01'), to: new Date() });
      
      const [job] = await db.insert(jobs).values({
          title: faker.hacker.phrase().replace(/^./, (char) => char.toUpperCase()),
          description: faker.lorem.sentence(),
          department: getRandomItem(departments),
          createdBy: admin.id,
          date: jobDate,
          status: status,
      }).returning();
      
      // If job is not pending or cancelled, assign it and potentially create history
      if (status === 'in_progress' || status === 'completed') {
        const assignedEmployee = getRandomItem(allEmployeeUsers);
        
        const [assignment] = await db.insert(assignments).values({
            jobId: job.id,
            userId: assignedEmployee.id,
            assignedAt: jobDate,
        }).returning();

        // If job is completed, create a history record
        if (status === 'completed') {
          const completedDate = faker.date.soon({ days: 5, refDate: jobDate });
          await db.insert(jobHistory).values({
            jobId: job.id,
            employeeId: assignedEmployee.id,
            description: `Completed task: ${faker.lorem.sentence()}`,
            completedAt: completedDate,
          });
        }
      }
    }
    console.log(`✅ ${NUM_JOBS} jobs with related data seeded.`);

    console.log('🌿 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main();