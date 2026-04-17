import { describe, it, expect, vi, beforeEach } from 'vitest';
import Apple from '../../../../../../domain/ObjectModule/Items/Consumables/Food/Apple';
import MegaMushroom from '../../../../../../domain/ObjectModule/Items/Consumables/MegaMushroom';
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

describe('Consumables - Food', () => {
  let target: MockEntity;

  beforeEach(() => {
    vi.spyOn(Dice, 'rollDice').mockReturnValue(5); // Garante maxHp de 15
    target = new MockEntity(1);
    vi.clearAllMocks();
  });

  describe('Apple', () => {
    it('deve inicializar com propriedades corretas de comida', () => {
      const apple = new Apple();
      expect(apple.category).toBe('food');
      expect(apple.rarity).toBe('common');
    });

    it('deve curar vida e mana do alvo ao ser consumida', () => {
      const apple = new Apple();
      target.attributes.hp = 1;
      target.attributes.mana = 1;
      apple.use(target);
      // O HP é curado, mas limitado pelo maxHp (15)
      expect(target.attributes.hp).toBe(15);
      expect(target.attributes.mana).toBe(1 + 5); // ManaRestoreEffect(5)
    });
  });

  describe('MegaMushroom', () => {
    it('deve conter e aplicar o SizeBoostEffect ao ser consumido', () => {
      const mushroom = new MegaMushroom();
      const effect = mushroom.effects[0]!;
      const applySpy = vi.spyOn(effect, 'apply');
      
      mushroom.use(target);
      
      expect(applySpy).toHaveBeenCalledOnce();
      expect(applySpy).toHaveBeenCalledWith(target);
    });
  });
});