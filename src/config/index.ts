// /src/config/index.ts
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

// เพิ่มบรรทัดนี้เพื่อ Debug
console.log('🔑 JWT Secret from .env:', process.env.JWT_SECRET); 

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
});

export const config = configSchema.parse(process.env);