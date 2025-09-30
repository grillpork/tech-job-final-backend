import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../config/index.js';

async function jwtPlugin(server: FastifyInstance) {
  server.register(fastifyJwt, {
    secret: config.JWT_SECRET,
  });
}

export default fastifyPlugin(jwtPlugin);