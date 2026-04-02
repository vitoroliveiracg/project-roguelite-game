/**
 * @file Web Worker dedicado exclusivamente à detecção de colisões.
 * Recebe o estado de todos os objetos, constrói uma Quadtree e retorna os pares que colidiram.
*/

import Quadtree from "../shared/QuadTree";

type BoundedElement = {
    id: number;
    x: number; y: number;
    width: number; height: number;
    radius: number;
}

self.addEventListener('message', (event: MessageEvent<{hitboxData: Float32Array, hitboxCount: number, worldBounds: any}>) => {
  const { hitboxData, hitboxCount, worldBounds } = event.data;

  const collisionTree = new Quadtree<BoundedElement>(worldBounds);
  const elements: BoundedElement[] = [];

  for (let i = 0; i < hitboxCount; i++) {
      const id = hitboxData[i * 4] ?? 0;
      const cx = hitboxData[i * 4 + 1] ?? 0;
      const cy = hitboxData[i * 4 + 2] ?? 0;
      const radius = hitboxData[i * 4 + 3] ?? 0;

      const element = { id, x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2, radius };
      elements.push(element);
      collisionTree.insert(element);
  }

  const collidingPairs: number[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < elements.length; i++) {
    const elA = elements[i];
    if (!elA) continue;

    const potentialColliders = collisionTree.retrieve(elA);

    for (let j = 0; j < potentialColliders.length; j++) {
      const elB = potentialColliders[j];
      if (!elB) continue;
      if (elA.id === elB.id) continue;

      const pairKey = elA.id < elB.id ? `${elA.id}-${elB.id}` : `${elB.id}-${elA.id}`;
      if (processedPairs.has(pairKey)) continue;

      const dx = (elA.x + elA.radius) - (elB.x + elB.radius);
      const dy = (elA.y + elA.radius) - (elB.y + elB.radius);
      const distSq = dx * dx + dy * dy;
      const radSum = elA.radius + elB.radius;

      if (distSq <= radSum * radSum) {
          collidingPairs.push(elA.id, elB.id);
          processedPairs.add(pairKey);
      }
    }
  }

  self.postMessage(new Int32Array(collidingPairs));
});
