import { getAllPositions } from './position.service';

export async function getAllPositionsHandler() {
  const positions = await getAllPositions();
  return positions;
}