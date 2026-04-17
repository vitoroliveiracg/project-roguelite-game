import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import StunStatus from '../../../../../domain/ObjectModule/Entities/Status/StunStatus';

const mockEventManager = { on: vi.fn(), dispatch: vi.fn() };
class MockEntity extends Entity {
  constructor() { super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager); }
  update() {}
}

describe('StunStatus', () => {
  let target: MockEntity;

  beforeEach(() => {
    target = new MockEntity();
    vi.clearAllMocks();
  });

  it('deve despachar partícula roxa de atordoamento a cada tick', () => {
    const stun = new StunStatus(3);
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    stun.update(0.5, target);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'magicAura', color: '#9400D3' }));
  });
});