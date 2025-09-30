import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import sensible from "./plugins/sensible";
import jwt from "./plugins/jwt";
import cors from "@fastify/cors";
import { config } from "./config";
import authRoutes from "./modules/auth/auth.route";
import userRoutes from "./modules/users/user.route";
import jobRoutes from "./modules/jobs/job.route";
import inventoryRoutes from "./modules/inventory/inventory.route";
import multipart from "@fastify/multipart";
import reportRoutes from './modules/reports/report.route';
import positionRoutes from './modules/positions/position.route';
import ticketRoutes from "./modules/tickets/ticket.route";
import notificationRoutes from './modules/notifications/notification.route';

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string;
      role: string;
    };
  }
}

async function buildServer() {
  const server = Fastify({
    logger: true,
  });

  // Register plugins
  await server.register(cors, {
    origin: "*", // ควรเปลี่ยนเป็น URL ของ Frontend จริงใน Production
  });
  await server.register(jwt);
  await server.register(sensible);
  await server.register(multipart, {
    limits: {
      fileSize: 1024 * 1024 * 5, // 5 Megabytes
    },
  });

  // Custom JSON Schema for Zod
  server.setSerializerCompiler(({ schema }) => {
    return (data) => JSON.stringify(data);
  });
  server.setValidatorCompiler(({ schema }) => {
    const jsonSchema = zodToJsonSchema(schema as any, { $refStrategy: "none" });
    return (data) => {
      try {
        (schema as any).parse(data);
        return { value: data };
      } catch (e) {
        return { error: e as Error };
      }
    };
  });

  // Health check route
   server.get('/health', async () => { return { status: 'ok' };
  });


  // Register modules routes
  server.register(authRoutes, { prefix: "/api/auth" });
  server.register(userRoutes, { prefix: "/api/users" });
  server.register(jobRoutes, { prefix: "/api/jobs" });
  server.register(inventoryRoutes, { prefix: "/api/inventory" });
  server.register(reportRoutes, { prefix: "/api/reports" });
  server.register(positionRoutes, { prefix: '/api/positions' })
  server.register(ticketRoutes, { prefix: '/api/tickets' })
  server.register(notificationRoutes, { prefix: '/api/notifications' });
  return server;
}

async function main() {
  const server = await buildServer();
  try {
    await server.listen({ port: config.PORT, host: "0.0.0.0" });
    console.log(`Server listening at http://localhost:${config.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
