// /src/config/index.ts
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
});

export const config = configSchema.parse(process.env);