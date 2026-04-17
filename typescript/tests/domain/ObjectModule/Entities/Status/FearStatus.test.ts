import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import FearStatus from '../../../../../domain/ObjectModule/Entities/Status/FearStatus';
import Vector2D from '../../../../../domain/shared/Vector2D';

const mockEventManager = { on: vi.fn(), dispatch: vi.fn() };
class MockEntity extends Entity {
  constructor() { super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager); }
  update() {}
}

describe('FearStatus', () => {
  let target: MockEntity;

  beforeEach(() => {
    target = new MockEntity();
    vi.clearAllMocks();
  });

  it('deve inverter o vetor de velocidade (intenção de movimento da IA) a cada tick', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.05); // Garante a emissão da partícula (chance < 0.1)
    const fear = new FearStatus(3);
    target.velocity = new Vector2D(10, -5);
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    fear.update(0.02, target);
    expect(target.velocity.x).toBe(-10);
    expect(target.velocity.y).toBe(5);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'magicAura' }));
    randomSpy.mockRestore();
  });
});