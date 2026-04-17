import { describe, it, expect } from 'vitest';
import { Vertex2D } from '../../../domain/shared/Vertex2D';

describe('Vertex2D', () => {
  it('deve construir com um ponto e sem conexões', () => {
    const dot = { x: 10, y: 20 };
    const vertex = new Vertex2D(dot);

    expect(vertex.dot).toEqual(dot);
    // O construtor apenas atribui a referência
    expect(vertex.dot).toBe(dot);
    expect(vertex.conections).toBeNull();
  });

  it('deve construir com conexões', () => {
    const dot = { x: 10, y: 20 };
    const parent1 = new Vertex2D({ x: 0, y: 0 });
    const parent2 = new Vertex2D({ x: 5, y: 5 });
    const connections = { parent1, parent2 };

    const vertex = new Vertex2D(dot, connections);

    expect(vertex.dot).toEqual(dot);
    expect(vertex.conections).toEqual(connections);
    expect(vertex.conections?.parent1).toBe(parent1);
    expect(vertex.conections?.parent2).toBe(parent2);
  });
});