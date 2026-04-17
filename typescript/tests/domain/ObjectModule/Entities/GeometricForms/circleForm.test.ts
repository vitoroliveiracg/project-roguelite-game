import { describe, it, expect, vi } from 'vitest';
import CircleForm from '../../../../../domain/ObjectModule/Entities/geometryForms/circleForm';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Vector2D from '../../../../../domain/shared/Vector2D';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

describe('CircleForm', () => {
  it('deve construir com as propriedades corretas', () => {
    const circle = new CircleForm(1, { x: 10, y: 10 }, { width: 20, height: 20 }, mockEventManager);
    expect(circle.objectId).toBe('circle');
    expect(circle.state).toBe('normal');
  });

  it('deve se mover de acordo com a velocidade aplicada', () => {
    const circle = new CircleForm(1, { x: 10, y: 10 }, { width: 20, height: 20 }, mockEventManager);
    (circle as any).velocity = new Vector2D(100, 50);

    circle.update(0.5); // Meio segundo

    expect(circle.coordinates.x).toBe(10 + 50);
    expect(circle.coordinates.y).toBe(10 + 25);
  });
});