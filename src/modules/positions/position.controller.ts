import { getAllPositions } from './position.service.js';

export async function getAllPositionsHandler() {
  const positions = await getAllPositions();
  return positions;
}