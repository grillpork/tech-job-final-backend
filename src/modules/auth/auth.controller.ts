import { FastifyRequest, FastifyReply } from 'fastify';
import { LoginInput } from './auth.schema.js';
import { findUserByEmail } from './auth.service.js';
import { comparePassword } from '../../utils/password.utils.js';

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return reply.unauthorized('Invalid email or password');
  }

  const isMatch = await comparePassword(password, user.passwordHash);

  if (!isMatch) {
    return reply.unauthorized('Invalid email or password');
  }

  const token = request.server.jwt.sign({
    id: user.id,
    role: user.role,
  });

  return reply.send({ accessToken: token });
}