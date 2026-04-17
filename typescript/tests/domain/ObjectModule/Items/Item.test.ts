import { describe, it, expect } from 'vitest';
import Item from '../../../../domain/ObjectModule/Items/Item';

class DummyItem extends Item {
  constructor() {
    super('Dummy', 'desc', 1, 'common', 'material', 1, 100, true, 99, 50, []);
  }
}

describe('Item (Abstract Base)', () => {
  it('deve inicializar e expor as propriedades base corretamente', () => {
    const item = new DummyItem();
    expect(item.name).toBe('Dummy');
    expect(item.isStackable).toBe(true);
    expect(item.durability).toBe(50);
  });

  it('deve limitar a durabilidade para que não seja negativa', () => {
    const item = new DummyItem();
    item.durability = -100; // Tenta destruir de uma vez
    // O setter da classe base ignora a alteração se a durabilidade final for <= 0
    expect(item.durability).toBe(50); 
  });
});