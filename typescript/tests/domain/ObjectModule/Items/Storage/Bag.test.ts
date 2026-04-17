import { describe, it, expect } from 'vitest';
import Bag from '../../../../../domain/ObjectModule/Items/Storage/Bag';

// Dummy class para testar a classe abstrata Bag
class DummyBag extends Bag {
  constructor() {
    super(20, 'Big Bag', 'A big test bag', 102, 'rare', 102, 300, []);
  }
}

describe('Bag (Abstract Base)', () => {
  it('deve inicializar com o capacityBonus e outras propriedades corretamente', () => {
    const bag = new DummyBag();
    
    expect(bag.name).toBe('Big Bag');
    expect(bag.capacityBonus).toBe(20);
    expect(bag.category).toBe('storage');
    expect(bag.rarity).toBe('rare');
  });
});