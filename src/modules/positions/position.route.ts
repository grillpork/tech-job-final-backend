import { FastifyInstance } from 'fastify';
import { createAuthHook } from '../../hooks/authHook';
import { getAllPositionsHandler } from './position.controller';

const allUsersHook = createAuthHook(['admin', 'employee']);

async function positionRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: [allUsersHook] }, getAllPositionsHandler);
}

export default positionRoutes;