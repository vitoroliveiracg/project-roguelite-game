import { describe, it, expect, vi } from 'vitest';
import ObjectElement from '../../../domain/ObjectModule/ObjectElement';
import type { IEventManager } from '../../../domain/eventDispacher/IGameEvents';
import { HitBoxCircle } from '../../../domain/hitBox/HitBoxCircle';

const mockEventManager: IEventManager = {
  on: vi.fn(),
  dispatch: vi.fn(),
};

describe('ObjectElement', () => {
  it('deve construir com as propriedades corretas', () => {
    const size = { width: 10, height: 10 };
    const coords = { x: 5, y: 5 };
    const hitboxes = [new HitBoxCircle(coords, 0, 5, vi.fn())];
    
    const element = new ObjectElement(size, coords, 1, 'testId', mockEventManager, 'idle', hitboxes);

    expect(element.id).toBe(1);
    expect(element.objectId).toBe('testId');
    expect(element.size).toBe(size);
    expect(element.coordinates).toBe(coords);
    expect(element.state).toBe('idle');
    expect(element.hitboxes).toBe(hitboxes);
  });

  it('deve disparar um evento de despawn ao ser destruído', () => {
    const element = new ObjectElement({ width: 10, height: 10 }, { x: 5, y: 5 }, 99, 'testId', mockEventManager);
    
    (element as any).destroy();

    expect(mockEventManager.dispatch).toHaveBeenCalledWith('despawn', { objectId: 99 });
  });

  it('deve permitir a atualização de coordenadas', () => {
    const element = new ObjectElement({ width: 10, height: 10 }, { x: 5, y: 5 }, 1, 'testId', mockEventManager);
    const newCoords = { x: 100, y: 100 };
    element.coordinates = newCoords;
    expect(element.coordinates).toBe(newCoords);
  });
});