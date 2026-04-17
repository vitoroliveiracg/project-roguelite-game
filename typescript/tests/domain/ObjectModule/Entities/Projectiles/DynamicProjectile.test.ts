import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DynamicProjectile } from '../../../../../domain/ObjectModule/Entities/projectiles/DynamicProjectile';
import Vector2D from '../../../../../domain/shared/Vector2D';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type Effect from '../../../../../domain/ObjectModule/Items/Effects/Effect';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockAttacker extends Entity {
  constructor(id: number) {
    const attrs = new Attributes(8, 1, 10, 10, 10, 10, 10, 10);
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, 'player', attrs, mockEventManager);
  }
  update() {}
}

describe('DynamicProjectile', () => {
  let attacker: MockAttacker;
  let attack: Attack;

  beforeEach(() => {
    attacker = new MockAttacker(1);
    attack = new Attack(attacker, 10, 'magic');
    vi.clearAllMocks();
  });

  it('deve se mover a 300 de velocidade e se destruir na distância máxima de 500', () => {
    const spell = new DynamicProjectile(100, { x: 0, y: 0 }, new Vector2D(1, 0), attack, [], mockEventManager);
    const despawnSpy = vi.spyOn(mockEventManager, 'dispatch');

    spell.update(1); // 300 displacement
    expect(spell.coordinates.x).toBeCloseTo(300);
    expect(despawnSpy).not.toHaveBeenCalledWith('despawn', { objectId: 100 });

    spell.update(1); // +300 -> 600 total
    expect(despawnSpy).toHaveBeenCalledWith('despawn', { objectId: 100 });
  });

  it('deve aplicar dano e os efeitos ao colidir com um alvo e não repetir hits no frame', () => {
    const mockEffect = { name: "mock", description: "mock", apply: vi.fn() } as unknown as Effect;
    const spell = new DynamicProjectile(100, { x: 0, y: 0 }, new Vector2D(1, 0), attack, [mockEffect], mockEventManager);
    
    const target = new MockAttacker(2);
    const attackExecuteSpy = vi.spyOn(attack, 'execute');

    spell.hitboxes![0]!.onColision(target);
    spell.hitboxes![0]!.onColision(target); // Tentativa forçada de Multi-Hit falso

    expect(attackExecuteSpy).toHaveBeenCalledOnce();
    expect(attackExecuteSpy).toHaveBeenCalledWith(target, expect.any(Vector2D));
    expect(mockEffect.apply).toHaveBeenCalledWith(target);
  });
});