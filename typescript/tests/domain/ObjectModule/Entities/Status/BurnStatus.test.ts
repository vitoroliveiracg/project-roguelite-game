import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import BurnStatus from '../../../../../domain/ObjectModule/Entities/Status/BurnStatus';

const mockEventManager = { on: vi.fn(), dispatch: vi.fn() };
class MockEntity extends Entity {
  constructor() { super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager); }
  update() {}
}

describe('BurnStatus', () => {
  let target: MockEntity;
  let source: MockEntity;

  beforeEach(() => {
    target = new MockEntity();
    source = new MockEntity();
    vi.clearAllMocks();
  });

  it('deve aplicar dano de fogo e despachar partícula no tick', () => {
    const burn = new BurnStatus(3, source);
    const takeDamageSpy = vi.spyOn(target, 'takeDamage');
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    burn.update(1.0, target);
    expect(takeDamageSpy).toHaveBeenCalledWith(expect.objectContaining({ damageType: 'fire' }));
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'magicAura', color: '#FF4500' }));
  });
});