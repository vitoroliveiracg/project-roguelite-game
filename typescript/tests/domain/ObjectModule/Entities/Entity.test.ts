import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity, { type DamageInfo } from '../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../domain/ObjectModule/Entities/Attributes';
import Vector2D from '../../../../domain/shared/Vector2D';
import type { IEventManager } from '../../../../domain/eventDispacher/IGameEvents';
import StatusEffect from '../../../../domain/ObjectModule/Entities/Status/StatusEffect';
import Dice from '../../../../domain/shared/Dice';

// --- Mocks e Fakes ---
const mockEventManager: IEventManager = {
  on: vi.fn(),
  dispatch: vi.fn(),
};

class DummyEntity extends Entity {
  constructor(id: number, coords: {x: number, y: number}, attributes: Attributes, eventManager: IEventManager) {
    super(id, coords, { width: 10, height: 10 }, 'dummy', attributes, eventManager);
  }
  update(deltaTime: number, player?: any): void {
    this.move(deltaTime);
  }
}

class MockStatus extends StatusEffect {
    constructor(id: string, duration: number) {
        super(id, 'mock status', duration);
    }
}

describe('Entity', () => {
  let entity: DummyEntity;
  let attributes: Attributes;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Dice, 'rollDice').mockReturnValue(5); // Garante que o HP inicial seja determinístico (15)
    attributes = new Attributes(8, 1, 10, 10, 10, 10, 10, 10); // 15 HP, 2 Defence
    entity = new DummyEntity(100, { x: 50, y: 50 }, attributes, mockEventManager);
  });

  it('deve aplicar dano e reduzir o HP', () => {
    const damageInfo: DamageInfo = {
      totalDamage: 10,
      damageType: 'physical',
      isCritical: false,
      direction: new Vector2D(1, 0),
      attacker: {} as Entity,
    };

    entity.takeDamage(damageInfo);
    // Final Damage = 10 - 2 (defence) = 8
    expect(entity.attributes.hp).toBe(15 - 8);
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('entityDamaged', expect.any(Object));
  });

  it('deve morrer se o HP chegar a zero ou menos', () => {
    const damageInfo: DamageInfo = {
      totalDamage: 20,
      damageType: 'physical',
      isCritical: false,
      direction: new Vector2D(1, 0),
      attacker: {} as Entity,
    };

    entity.takeDamage(damageInfo);
    expect(entity.attributes.hp).toBeLessThanOrEqual(0);
    expect(entity.state).toBe('dead');
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('entityDied', expect.any(Object));
    // destroy() chama o despawn
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('despawn', { objectId: 100 });
  });

  it('deve aplicar knockback ao receber dano', () => {
    const direction = new Vector2D(1, 0);
    const damageInfo: DamageInfo = {
      totalDamage: 5,
      damageType: 'physical',
      isCritical: false,
      direction: direction,
      attacker: {} as Entity,
    };

    const initialAccelX = (entity as any).accelerator.x;
    entity.takeDamage(damageInfo);

    // Accelerator = direction * hurtLaunchFactor (10)
    expect((entity as any).accelerator.x).toBe(initialAccelX + 10);
  });

  describe('Status Effects', () => {
    it('deve aplicar um novo status', () => {
      const stun = new MockStatus('stun', 2);
      entity.applyStatus(stun);
      expect(entity.activeStatuses.has('stun')).toBe(true);
    });

    it('deve impedir o movimento se estiver atordoado (stunned)', () => {
        entity.velocity = new Vector2D(10, 10);
        const stun = new MockStatus('stun', 2);
        entity.applyStatus(stun);

        entity.update(0.16); // Chama o move()

        // A velocidade deve ser zerada pelo status
        expect(entity.velocity.x).toBe(0);
        expect(entity.velocity.y).toBe(0);
    });

    it('deve remover o status após a duração expirar', () => {
        const stun = new MockStatus('stun', 1);
        entity.applyStatus(stun);
        expect(entity.activeStatuses.has('stun')).toBe(true);

        entity.updateStatuses(1.1); // Passa tempo suficiente para expirar

        expect(entity.activeStatuses.has('stun')).toBe(false);
    });
  });
});