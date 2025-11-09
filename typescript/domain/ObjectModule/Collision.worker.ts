/**
 * @file Web Worker dedicado exclusivamente à detecção de colisões.
 * Recebe o estado de todos os objetos, constrói uma Quadtree e retorna os pares que colidiram.
*/

import Quadtree from "../shared/QuadTree";
import type { HitboxDebugShape } from "../hitBox/HitBox";

/**
 * Verifica se dois círculos se intersectam.
 * @param c1 O primeiro círculo, com propriedades x, y, e radius.
 * @param c2 O segundo círculo.
 * @returns `true` se eles se intersectam, `false` caso contrário.
 */
function circleIntersectsCircle(c1: { x: number, y: number, radius: number }, c2: { x: number, y: number, radius: number }): boolean {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < c1.radius + c2.radius;
}

type PlainObjectElement = {
  id: number;
  x: number; y: number;
  width: number; height: number;
  hitboxes: HitboxDebugShape[] | null;
}

interface CollisionWorkerData {
  elements: PlainObjectElement[];
  worldBounds: { x: number, y: number, width: number, height: number };
}

/**
 * Ouve mensagens da thread principal para iniciar a detecção de colisão.
 */
self.addEventListener('message', (event: MessageEvent<CollisionWorkerData>) => {
  const { elements, worldBounds } = event.data;

  // 1. Constrói a Quadtree com os elementos recebidos.
  const collisionTree = new Quadtree<PlainObjectElement>(worldBounds);
  for (const element of elements) {
    collisionTree.insert(element);
  }

  const collidingPairs: [number, number][] = [];
  const processedPairs = new Set<string>();

  // 2. Itera sobre cada elemento para encontrar colisões.
  for (const elementA of elements) {
    if (!elementA.hitboxes || elementA.hitboxes.length === 0) continue;

    const elementBounds = {
      x: elementA.x,
      y: elementA.y,
      width: elementA.width,
      height: elementA.height,
    };

    const potentialColliders = collisionTree.retrieve(elementBounds);

    for (const elementB of potentialColliders) {
      if (elementA.id === elementB.id || !elementB.hitboxes || elementB.hitboxes.length === 0) continue;

      const pairKey = elementA.id < elementB.id ? `${elementA.id}-${elementB.id}` : `${elementB.id}-${elementA.id}`;
      if (processedPairs.has(pairKey)) continue;

      for (const hitboxA of elementA.hitboxes) {
        let hasCollided = false;
        for (const hitboxB of elementB.hitboxes) {
          // A lógica de interseção é recriada aqui, pois os métodos são perdidos na clonagem.
          // Atualmente, só suporta colisão círculo-círculo.
          if (hitboxA.type === 'circle' && hitboxB.type === 'circle') {
            // Usamos asserção de tipo para informar ao TS a estrutura do objeto após a verificação.
            const circleA = hitboxA as unknown as { x: number, y: number, radius: number };
            const circleB = hitboxB as unknown as { x: number, y: number, radius: number };
            if (circleIntersectsCircle(circleA, circleB)) {
            // 3. Adiciona o par de IDs à lista de resultados.
            collidingPairs.push([elementA.id, elementB.id]);
            processedPairs.add(pairKey);
            hasCollided = true;
            break;
          }
        }
        }
        if (hasCollided) break;
      }
    }
  }

  // 4. Envia a lista de pares que colidiram de volta para a thread principal.
  self.postMessage(collidingPairs);
});
