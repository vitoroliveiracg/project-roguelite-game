import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Fireball } from '../../../../../domain/ObjectModule/Entities/projectiles/Fireball';
import Vector2D from '../../../../../domain/shared/Vector2D';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number) {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
}

describe('Fireball', () => {
  let attacker: MockEntity;
  let attack: Attack;

  beforeEach(() => {
    attacker = new MockEntity(1);
    attack = new Attack(attacker, 10, 'fire');
    vi.clearAllMocks();
  });

  it('deve se destruir ao colidir com um alvo', () => {
    const fireball = new Fireball(101, { x: 0, y: 0 }, new Vector2D(1, 0), attack, [], mockEventManager);
    const target = new MockEntity(2);
    const despawnSpy = vi.spyOn(mockEventManager, 'dispatch');

    fireball.hitboxes![0]!.onColision(target);

    expect(despawnSpy).toHaveBeenCalledWith('despawn', { objectId: 101 });
  });

  it('deve aplicar seus efeitos ao colidir', () => {
    const mockEffect = { name: "mock", description: "mock", apply: vi.fn() };
    const fireball = new Fireball(101, { x: 0, y: 0 }, new Vector2D(1, 0), attack, [mockEffect], mockEventManager);
    const target = new MockEntity(2);

    fireball.hitboxes![0]!.onColision(target);

    expect(mockEffect.apply).toHaveBeenCalledWith(target);
  });
});