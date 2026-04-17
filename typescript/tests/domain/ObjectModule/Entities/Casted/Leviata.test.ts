import { describe, it, expect, vi, beforeEach } from 'vitest';
import Leviata from '../../../../../domain/ObjectModule/Entities/Casted/Leviata';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number, objectId: string) {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, objectId as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
}

describe('Leviata', () => {
  let attacker: MockEntity;
  let attack: Attack;

  beforeEach(() => {
    attacker = new MockEntity(1, 'player');
    attack = new Attack(attacker, 50, 'magical');
    vi.clearAllMocks();
  });

  it('deve se destruir após seu tempo de vida', () => {
    const leviata = new Leviata(101, { x: 100, y: 100 }, mockEventManager, attack);
    const destroySpy = vi.spyOn(leviata as any, 'destroy');

    leviata.update(1.0); // Tempo de vida é 0.95s

    expect(destroySpy).toHaveBeenCalledOnce();
  });

  it('deve aplicar dano a um inimigo ao colidir', () => {
    const leviata = new Leviata(101, { x: 100, y: 100 }, mockEventManager, attack);
    const enemy = new MockEntity(2, 'enemy');
    const takeDamageSpy = vi.spyOn(enemy, 'takeDamage');

    leviata.hitboxes![0]!.onColision(enemy);

    expect(takeDamageSpy).toHaveBeenCalledOnce();
  });

  it('não deve aplicar dano ao próprio conjurador', () => {
    const leviata = new Leviata(101, { x: 100, y: 100 }, mockEventManager, attack);
    const takeDamageSpy = vi.spyOn(attacker, 'takeDamage');

    leviata.hitboxes![0]!.onColision(attacker);

    expect(takeDamageSpy).not.toHaveBeenCalled();
  });
});