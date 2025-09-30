import Fastify from 'fastify';
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'; // Import Zod provider
import sensible from './plugins/sensible.js';
import jwt from './plugins/jwt.js';
import cors from '@fastify/cors';
import { config } from './config/index.js';

// Import routes
import authRoutes from './modules/auth/auth.route.js';
import userRoutes from './modules/users/user.route.js';
import jobRoutes from './modules/jobs/job.route.js';
import inventoryRoutes from './modules/inventory/inventory.route.js';
import positionRoutes from './modules/positions/position.route.js';
import reportRoutes from './modules/reports/report.route.js';
import ticketRoutes from './modules/tickets/ticket.route.js';
import notificationRoutes from './modules/notifications/notification.route.js';
import uploadRoutes from './modules/uploads/upload.route.js';


declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; role: string };
    user: {
      id: string;
      role: string;
    };
  }
}

async function buildServer() {

  const server = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  server.setValidatorCompiler(validatorCompiler);
  server.setSerializerCompiler(serializerCompiler);

  // Register plugins
  await server.register(cors, { origin: '*' });
  await server.register(jwt);
  await server.register(sensible);

  // Health check
  server.get('/health', async () => ({ status: 'ok' }));

  // Register all routes
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(userRoutes, { prefix: '/api/users' });
  server.register(jobRoutes, { prefix: '/api/jobs' });
  server.register(inventoryRoutes, { prefix: '/api/inventory' });
  server.register(positionRoutes, { prefix: '/api/positions' });
  server.register(reportRoutes, { prefix: '/api/reports' });
  server.register(ticketRoutes, { prefix: '/api/tickets' });
  server.register(notificationRoutes, { prefix: '/api/notifications' });
  server.register(uploadRoutes, { prefix: '/api/uploads' });

  return server;
}

async function main() {
  const server = await buildServer();
  try {
    await server.listen({ port: config.PORT, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();