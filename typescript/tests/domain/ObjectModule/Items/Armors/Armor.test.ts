import { describe, it, expect } from 'vitest';
import Armor from '../../../../../domain/ObjectModule/Items/Armors/Armor';

// Dummy class para testar a classe abstrata Armor
class DummyArmor extends Armor {
  constructor() {
    super(10, 5, 'helmet', 'Dummy Helmet', 'A test helmet', 99, 'rare', 99, 200, 150, [], 5);
  }
}

describe('Armor (Abstract Base)', () => {
  it('deve inicializar com as propriedades corretas e a categoria "armor"', () => {
    const armor = new DummyArmor();
    
    expect(armor.name).toBe('Dummy Helmet');
    expect(armor.category).toBe('armor');
    expect(armor.armorType).toBe('helmet');
    expect(armor.damageReductionPercent).toBe(10);
    expect(armor.dodgePercent).toBe(5);
    expect(armor.rarity).toBe('rare');
    expect(armor.requiredLevel).toBe(5);
  });
});