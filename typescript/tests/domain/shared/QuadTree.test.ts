import { describe, it, expect, beforeEach } from 'vitest';
import Quadtree from '../../../domain/shared/QuadTree';

interface TestObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

describe('Quadtree', () => {
  let quadtree: Quadtree<TestObject>;
  const boundary = { x: 0, y: 0, width: 100, height: 100 };

  beforeEach(() => {
    quadtree = new Quadtree<TestObject>(boundary, 4, 4);
  });

  it('deve inserir um objeto corretamente', () => {
    const obj = { id: 1, x: 10, y: 10, width: 5, height: 5 };
    quadtree.insert(obj);
    const retrieved = quadtree.retrieve(obj);
    expect(retrieved).toContain(obj);
  });

  it('não deve subdividir se max_objects não for atingido', () => {
    for (let i = 0; i < 4; i++) {
      quadtree.insert({ id: i, x: i * 10, y: i * 10, width: 5, height: 5 });
    }
    expect((quadtree as any).nodes.length).toBe(0);
  });

  it('deve subdividir quando max_objects for excedido', () => {
    for (let i = 0; i < 5; i++) {
      quadtree.insert({ id: i, x: i * 2, y: i * 2, width: 1, height: 1 });
    }
    expect((quadtree as any).nodes.length).toBe(4);
  });

  it('deve mover objetos para sub-nós após a subdivisão', () => {
    const objects = [
      { id: 1, x: 10, y: 10, width: 5, height: 5 }, // Quadrante 1 (top-left)
      { id: 2, x: 60, y: 10, width: 5, height: 5 }, // Quadrante 0 (top-right)
      { id: 3, x: 10, y: 60, width: 5, height: 5 }, // Quadrante 2 (bottom-left)
      { id: 4, x: 60, y: 60, width: 5, height: 5 }, // Quadrante 3 (bottom-right)
      { id: 5, x: 15, y: 15, width: 5, height: 5 }  // Quadrante 1 (top-left)
    ];

    objects.forEach(obj => quadtree.insert(obj));

    expect((quadtree as any).elements.length).toBe(0);
    expect((quadtree as any).nodes[1].elements).toContain(objects[0]);
    expect((quadtree as any).nodes[1].elements).toContain(objects[4]);
    expect((quadtree as any).nodes[0].elements).toContain(objects[1]);
    expect((quadtree as any).nodes[2].elements).toContain(objects[2]);
    expect((quadtree as any).nodes[3].elements).toContain(objects[3]);
  });

  it('deve recuperar apenas objetos dentro da área especificada', () => {
    const obj1 = { id: 1, x: 10, y: 10, width: 5, height: 5 };
    const obj2 = { id: 2, x: 80, y: 80, width: 5, height: 5 };
    quadtree.insert(obj1);
    quadtree.insert(obj2);

    const searchArea = { x: 0, y: 0, width: 50, height: 50 };
    const retrieved = quadtree.retrieve(searchArea);

    expect(retrieved).toContain(obj1);
    expect(retrieved).not.toContain(obj2);
    expect(retrieved.length).toBe(1);
  });

  it('deve recuperar objetos que sobrepõem a área de busca', () => {
    const overlappingObj = { id: 1, x: 45, y: 45, width: 10, height: 10 };
    quadtree.insert(overlappingObj);

    const searchArea = { x: 0, y: 0, width: 50, height: 50 };
    const retrieved = quadtree.retrieve(searchArea);
    expect(retrieved).toContain(overlappingObj);
  });

  it('deve limpar todos os objetos retendo a alocação dos sub-nós (Zero-GC)', () => {
    for (let i = 0; i < 10; i++) {
      quadtree.insert({ id: i, x: i * 5, y: i * 5, width: 2, height: 2 });
    }
    quadtree.clear();
    expect((quadtree as any).elements.length).toBe(0);
    expect((quadtree as any).nodes.length).toBe(4);
    const retrieved = quadtree.retrieve(boundary);
    expect(retrieved.length).toBe(0);
  });

  it('deve lidar com objetos nas fronteiras corretamente', () => {
    const boundaryObj = { id: 1, x: 48, y: 48, width: 4, height: 4 };
    quadtree.insert(boundaryObj);
    quadtree.insert({ id: 2, x: 10, y: 10, width: 1, height: 1 });
    quadtree.insert({ id: 3, x: 10, y: 10, width: 1, height: 1 });
    quadtree.insert({ id: 4, x: 10, y: 10, width: 1, height: 1 });
    quadtree.insert({ id: 5, x: 10, y: 10, width: 1, height: 1 });

    expect((quadtree as any).elements).toContain(boundaryObj);
    
    const retrieved = quadtree.retrieve(boundaryObj);
    expect(retrieved).toContain(boundaryObj);
  });

  describe('Benchmarks de Performance e Casos de Borda', () => {
    
    it('deve executar matematicamente menos checagens absolutas que a abordagem bruta O(N^2) mitigando Flakiness de CI', () => {
      const objectCount = 1000; // Foco na prova matemática, não no relógio da CPU
      const objects: TestObject[] = [];
      for (let i = 0; i < objectCount; i++) {
        objects.push({
          id: i,
          x: Math.random() * boundary.width,
          y: Math.random() * boundary.height,
          width: 2,
          height: 2,
        });
      }

      // Benchmark Naive (Brute-force)
      let naiveChecks = 0;
      let naiveCollisions = 0;
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          const a = objects[i]!;
          const b = objects[j]!;
          naiveChecks++;
          if (!(a.x > b.x + b.width || a.x + a.width < b.x || a.y > b.y + b.height || a.y + a.height < b.y)) {
            naiveCollisions++;
          }
        }
      }

      // Benchmark Quadtree (Zero-GC approach)
      // Otimização: max_levels reduzido para 5 para evitar colapso de fronteira em área 100x100
      const testTree = new Quadtree<TestObject>(boundary, 4, 5);
      objects.forEach(obj => testTree.insert(obj));
      
      let quadtreeChecks = 0;
      let quadtreeCollisions = 0;
      const resultBuffer: TestObject[] = []; // Alocação contígua e reciclada fora do loop
      
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (!obj) continue;
        
        resultBuffer.length = 0; // Zero-GC array clear
        testTree.retrieve(obj, resultBuffer);
        
        for (let j = 0; j < resultBuffer.length; j++) {
          const other = resultBuffer[j];
          if (other && obj.id !== other.id) {
             quadtreeChecks++;
             // Álgebra bruta nativa em vez de manipulação de Strings/Hash Sets
             if (!(obj.x > other.x + other.width || obj.x + obj.width < other.x || obj.y > other.y + other.height || obj.y + obj.height < other.y)) {
                quadtreeCollisions++;
             }
          }
        }
      }
      
      quadtreeCollisions /= 2; // Desconta a checagem bidirecional (A->B e B->A)
      // Prova arquitetural de que o Teorema Espacial executa menos passos.
      expect(quadtreeChecks / 2).toBeLessThan(naiveChecks);
    });

    it('deve reutilizar nós filhos após limpar (Validação Zero-GC)', () => {
      const objects: TestObject[] = [];
      for (let i = 0; i < 10; i++) {
          objects.push({ id: i, x: Math.random() * 90, y: Math.random() * 90, width: 5, height: 5 });
      }
      objects.forEach(obj => quadtree.insert(obj));
  
      expect((quadtree as any).nodes.length).toBe(4);
      const childNodeRef = (quadtree as any).nodes[0];
  
      quadtree.clear();
      objects.forEach(obj => quadtree.insert(obj));
      
      const newChildNodeRef = (quadtree as any).nodes[0];
  
      expect(newChildNodeRef).toBe(childNodeRef);
    });

    it('não deve quebrar com densidade de singularidade (Pior Caso)', () => {
      const singularityPoint = { x: 50, y: 50, width: 1, height: 1 };
      const objectCount = 1000;
      const tree = new Quadtree<TestObject>(boundary, 4, 4);
  
      for (let i = 0; i < objectCount; i++) {
          tree.insert({ id: i, ...singularityPoint });
      }
  
      const retrieved = tree.retrieve(singularityPoint);
      expect(retrieved.length).toBe(objectCount);
    });
  });
});