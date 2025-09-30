import { db } from '../../db';

export async function getAllPositions() {
  return db.query.positions.findMany({
    orderBy: (position, { asc }) => [asc(position.name)],
  });
}