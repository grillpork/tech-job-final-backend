import { db } from '../../db/index.js';

export async function getAllPositions() {
  return db.query.positions.findMany({
    orderBy: (position: { name: any; }, { asc }: any) => [asc(position.name)],
  });
}