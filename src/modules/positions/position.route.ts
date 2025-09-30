import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook.js';
import { getAllPositionsHandler } from './position.controller.js';

const allUsersHook = createAuthHook(['admin', 'employee']);

async function positionRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [allUsersHook] }, getAllPositionsHandler);
}

export default positionRoutes;