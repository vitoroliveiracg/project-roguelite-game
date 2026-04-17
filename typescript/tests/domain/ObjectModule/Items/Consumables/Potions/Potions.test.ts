import { describe, it, expect, vi, beforeEach } from 'vitest';
import HealthPotion from '../../../../../../domain/ObjectModule/Items/Consumables/Potions/HealthPotion';
import ManaPotion from '../../../../../../domain/ObjectModule/Items/Consumables/Potions/ManaPotion';
import AdrenalineFlask from '../../../../../../domain/ObjectModule/Items/Consumables/Potions/AdrenalineFlask';
import VampireFang from '../../../../../../domain/ObjectModule/Items/Consumables/VampireFang';
import DemonBlood from '../../../../../../domain/ObjectModule/Items/Consumables/DemonBlood';
import Entity from '../../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../../domain/eventDispacher/IGameEvents';
import Dice from '../../../../../../domain/shared/Dice';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number) {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
}

describe('Consumables - Potions', () => {
  let target: MockEntity;

  beforeEach(() => {
    vi.spyOn(Dice, 'rollDice').mockReturnValue(5); // Garante maxHp de 15
    target = new MockEntity(1);
    vi.clearAllMocks();
  });

  it('HealthPotion deve curar 50 de HP', () => {
    const potion = new HealthPotion();
    target.attributes.hp = 1;
    potion.use(target);
    // O Setter da classe limitará ao maxHp (que é 15 no mock)
    expect(target.attributes.hp).toBe(15); 
  });

  it('ManaPotion deve restaurar 30 de Mana', () => {
    const potion = new ManaPotion();
    target.attributes.mana = 10;
    potion.use(target);
    expect(target.attributes.mana).toBe(40);
  });

  it('AdrenalineFlask deve aumentar a velocidade base', () => {
    const potion = new AdrenalineFlask();
    const initialSpeed = target.attributes.speed;

    potion.use(target);
    expect(target.attributes.speed).toBe(initialSpeed + 5);
  });

  it('DemonBlood deve aumentar a força base', () => {
    const potion = new DemonBlood();
    const initialStrength = target.attributes.strength;
    
    Object.defineProperty(target.attributes, 'strength', { value: initialStrength, writable: true, configurable: true });

    potion.use(target);
    expect(target.attributes.strength).toBe(initialStrength + 2);
  });

  it('VampireFang deve aumentar o Lifesteal permanente', () => {
    const potion = new VampireFang();
    
    Object.defineProperty(target.attributes, 'lifesteal', { value: 0, writable: true, configurable: true });

    potion.use(target);
    expect((target.attributes as any).lifesteal).toBe(1);
  });
  
  it('Todas as poções devem pertencer à categoria "potion"', () => {
      expect(new HealthPotion().category).toBe('potion');
      expect(new DemonBlood().category).toBe('potion');
      expect(new VampireFang().category).toBe('potion');
  });
});