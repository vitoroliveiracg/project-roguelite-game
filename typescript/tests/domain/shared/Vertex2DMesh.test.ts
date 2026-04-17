import { describe, it, expect } from 'vitest';
import { Vertex2DMesh } from '../../../domain/shared/Vertex2DMesh';
import { Vertex2D } from '../../../domain/shared/Vertex2D';

describe('Vertex2DMesh', () => {
  it('deve construir com um array de vértices', () => {
    const vertex1 = new Vertex2D({ x: 0, y: 0 });
    const vertex2 = new Vertex2D({ x: 10, y: 10 });
    const meshArray = [vertex1, vertex2];

    const vertexMesh = new Vertex2DMesh(meshArray);

    expect(vertexMesh.mesh).toBe(meshArray);
    expect(vertexMesh.mesh.length).toBe(2);
    expect(vertexMesh.mesh[0]).toBe(vertex1);
  });

  it('deve construir com um array vazio', () => {
    const vertexMesh = new Vertex2DMesh([]);
    expect(vertexMesh.mesh).toEqual([]);
    expect(vertexMesh.mesh.length).toBe(0);
  });
});