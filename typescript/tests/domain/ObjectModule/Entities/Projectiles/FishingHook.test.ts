import { describe, it, expect, vi, beforeEach } from 'vitest';
import FishingHook from '../../../../../domain/ObjectModule/Entities/projectiles/FishingHook';
import Vector2D from '../../../../../domain/shared/Vector2D';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number, objectId: string = 'dummy') {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, objectId as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
}

// Subclasse de teste para expor membros protegidos/privados
class TestableFishingHook extends FishingHook {
  public getVelocity() {
    return this.velocity;
  }
  public getHookedTarget() {
    return (this as any).hookedTarget;
  }
}

describe('FishingHook', () => {
  let attacker: MockEntity;
  let attack: Attack;

  beforeEach(() => {
    attacker = new MockEntity(1, 'player');
    attack = new Attack(attacker, 10, 'physical');
    vi.clearAllMocks();
  });

  it('deve se prender a um alvo e parar de se mover', () => {
    const hook = new TestableFishingHook(101, { x: 0, y: 0 }, new Vector2D(1, 0), attack, mockEventManager);
    const target = new MockEntity(2);

    hook.hitboxes![0]!.onColision(target);

    expect(hook.getHookedTarget()).toBe(target);
    expect(hook.getVelocity().x).toBe(0);
    expect(hook.getVelocity().y).toBe(0);
  });

  it('uma vez preso, deve seguir as coordenadas do alvo', () => {
    const hook = new FishingHook(101, { x: 0, y: 0 }, new Vector2D(1, 0), attack, mockEventManager);
    const target = new MockEntity(2);
    target.coordinates = { x: 200, y: 200 };
    target.takeDamage = vi.fn(); // Blinda a entidade contra rolagens críticas imprevistas, garantindo a sobrevivência

    hook.hitboxes![0]!.onColision(target);
    hook.update(0.16);

    // A posição do anzol deve ser a do alvo (com offset do centro)
    expect(hook.coordinates.x).toBe(200 + 10 / 2 - 16 / 2);
    expect(hook.coordinates.y).toBe(200 + 10 / 2 - 16 / 2);
  });

  it('deve apenas causar dano e se destruir se o alvo for um "boss"', () => {
    const hook = new FishingHook(101, { x: 0, y: 0 }, new Vector2D(1, 0), attack, mockEventManager);
    const boss = new MockEntity(3, 'big_boss_monster');
    const takeDamageSpy = vi.spyOn(boss, 'takeDamage');
    const destroySpy = vi.spyOn(hook as any, 'destroy');

    hook.hitboxes![0]!.onColision(boss);

    expect((hook as any).hookedTarget).toBeNull(); // Não deve prender
    expect(takeDamageSpy).toHaveBeenCalledOnce();
    expect(destroySpy).toHaveBeenCalledOnce();
  });
});