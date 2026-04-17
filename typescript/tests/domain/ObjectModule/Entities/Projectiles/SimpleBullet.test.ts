import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleBullet } from '../../../../../domain/ObjectModule/Entities/projectiles/SimpleBullet';
import Vector2D from '../../../../../domain/shared/Vector2D';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockAttacker extends Entity {
  constructor(id: number) {
    const attrs = new Attributes(8, 1, 10, 10, 10, 10, 10, 10);
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, 'player', attrs, mockEventManager);
  }
  update() {}
}

describe('SimpleBullet', () => {
  let attacker: MockAttacker;
  let attack: Attack;

  beforeEach(() => {
    attacker = new MockAttacker(1);
    attack = new Attack(attacker, 10, 'physical');
    vi.clearAllMocks();
  });

  it('deve se mover na direção especificada e se destruir após a distância máxima', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0); // Neutraliza ruído balístico
    const bullet = new SimpleBullet(100, { x: 0, y: 0 }, new Vector2D(1, 0), attack, mockEventManager);
    const despawnSpy = vi.spyOn(mockEventManager, 'dispatch');

    // Avança próximo ao limite máximo sem estourá-lo
    bullet.update(0.99); 
    expect(bullet.coordinates.x).toBeCloseTo(148.5);
    expect(despawnSpy).not.toHaveBeenCalledWith('despawn', { objectId: 100 });

    // Ultrapassa a distância máxima (150)
    bullet.update(0.02);
    expect(despawnSpy).toHaveBeenCalledWith('despawn', { objectId: 100 });

    randomSpy.mockRestore();
  });

  it('deve aplicar dano ao colidir com um alvo válido', () => {
    const bullet = new SimpleBullet(100, { x: 0, y: 0 }, new Vector2D(1, 0), attack, mockEventManager);
    const target = new MockAttacker(2); // Usando MockAttacker como alvo
    const takeDamageSpy = vi.spyOn(target, 'takeDamage');
    const attackExecuteSpy = vi.spyOn(attack, 'execute');

    // Simula a colisão
    bullet.hitboxes![0]!.onColision(target);

    expect(attackExecuteSpy).toHaveBeenCalledWith(target, expect.any(Vector2D));
    expect(takeDamageSpy).toHaveBeenCalled();
  });

  it('deve perfurar inimigos se tiver pierceCount > 0', () => {
    // Substitui o Getter derivativo e força o status estrito na memória
    Object.defineProperty(attacker.attributes, 'piercing', { value: 1, configurable: true });
    
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);
    const bullet = new SimpleBullet(100, { x: 0, y: 0 }, new Vector2D(1, 0), attack, mockEventManager);
    const despawnSpy = vi.spyOn(mockEventManager, 'dispatch');
    
    const target1 = new MockAttacker(2);
    target1.takeDamage = vi.fn(); // Blinda contra morte
    const target2 = new MockAttacker(3);
    target2.takeDamage = vi.fn();

    // Primeiro hit
    bullet.hitboxes![0]!.onColision(target1);
    expect(despawnSpy).not.toHaveBeenCalledWith('despawn', { objectId: 100 });

    // Segundo hit
    bullet.hitboxes![0]!.onColision(target2);
    expect(despawnSpy).toHaveBeenCalledWith('despawn', { objectId: 100 }); // Agora deve se destruir

    randomSpy.mockRestore();
  });

  it('deve seguir o alvo se for um "magicMissile"', () => {
    const target = new MockAttacker(2);
    target.coordinates = { x: 100, y: 100 };
    const bullet = SimpleBullet.createSpawn(100, { type: 'magicMissile', coordinates: {x:0, y:0}, attack, target }, mockEventManager);
    
    bullet.update(0.1);

    // A direção deve apontar para o alvo (100, 100), resultando em um vetor normalizado (0.707, 0.707)
    expect(bullet.direction.x).toBeCloseTo(0.707);
    expect(bullet.direction.y).toBeCloseTo(0.707);
  });
});