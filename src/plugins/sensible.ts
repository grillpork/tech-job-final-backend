// /src/plugins/sensible.ts

import fp from "fastify-plugin";
import sensible from "@fastify/sensible";
import { FastifyInstance } from "fastify";

export default fp(async function (fastify: FastifyInstance) {
  fastify.register(sensible);
});
