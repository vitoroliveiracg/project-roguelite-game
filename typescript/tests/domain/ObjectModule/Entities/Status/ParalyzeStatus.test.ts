import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import ParalyzeStatus from '../../../../../domain/ObjectModule/Entities/Status/ParalyzeStatus';

const mockEventManager = { on: vi.fn(), dispatch: vi.fn() };
class MockEntity extends Entity {
  constructor() { super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager); }
  update() {}
}

describe('ParalyzeStatus', () => {
  let target: MockEntity;

  beforeEach(() => {
    target = new MockEntity();
    vi.clearAllMocks();
  });

  it('deve despachar partícula de raios e faíscas elétricas a cada tick', () => {
    const paralyze = new ParalyzeStatus(3);
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    paralyze.update(0.4, target);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'slashSparks' }));
  });
});