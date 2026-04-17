import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import BlindStatus from '../../../../../domain/ObjectModule/Entities/Status/BlindStatus';

const mockEventManager = { on: vi.fn(), dispatch: vi.fn() };
class MockEntity extends Entity {
  constructor() { super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager); }
  update() {}
}

describe('BlindStatus', () => {
  let target: MockEntity;

  beforeEach(() => {
    target = new MockEntity();
    vi.clearAllMocks();
  });

  it('deve reduzir a acurácia ao aplicar e restaurá-la ao ser removido', () => {
    const blind = new BlindStatus(5);
    
    // Substitui o getter mutável por uma propriedade estrita na memória para evitar flutuações e vazamentos
    Object.defineProperty(target.attributes, 'accuracy', { value: 100, writable: true, configurable: true });
    
    const initialAccuracy = (target.attributes as any).accuracy;
    blind.apply(target);
    expect((target.attributes as any).accuracy).toBe(initialAccuracy - 50);
    blind.update(5.1, target); // Força a remoção
    expect((target.attributes as any).accuracy).toBe(initialAccuracy);
  });
});