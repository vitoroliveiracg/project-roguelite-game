import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import FreezeStatus from '../../../../../domain/ObjectModule/Entities/Status/FreezeStatus';
import Vector2D from '../../../../../domain/shared/Vector2D';

const mockEventManager = { on: vi.fn(), dispatch: vi.fn() };
class MockEntity extends Entity {
  constructor() { super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager); }
  update() {}
}

describe('FreezeStatus', () => {
  let target: MockEntity;

  beforeEach(() => {
    target = new MockEntity();
    vi.clearAllMocks();
  });

  it('deve anular a velocidade atual forçadamente e despachar partícula a cada tick', () => {
    const freeze = new FreezeStatus(3);
    target.velocity = new Vector2D(50, 50);
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    freeze.update(0.5, target);
    expect(target.velocity.x).toBe(0);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'magicAura' }));
  });
});