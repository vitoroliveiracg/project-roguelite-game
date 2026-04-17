import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import SlowStatus from '../../../../../domain/ObjectModule/Entities/Status/SlowStatus';
import Vector2D from '../../../../../domain/shared/Vector2D';

const mockEventManager = { on: vi.fn(), dispatch: vi.fn() };
class MockEntity extends Entity {
  constructor() { super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager); }
  update() {}
}

describe('SlowStatus', () => {
  let target: MockEntity;

  beforeEach(() => {
    target = new MockEntity();
    vi.clearAllMocks();
  });

  it('deve reduzir a velocidade drasticamente (multiplicando por 0.4) e emitir partícula', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1); // Garante a emissão da partícula (chance < 0.2)
    const slow = new SlowStatus(3);
    target.velocity = new Vector2D(100, 100);
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    slow.update(0.2, target);
    expect(target.velocity.x).toBeCloseTo(40);
    expect(target.velocity.y).toBeCloseTo(40);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'magicAura' }));
    randomSpy.mockRestore();
  });
});