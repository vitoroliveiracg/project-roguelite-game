import { describe, it, expect } from 'vitest';
import Storage from '../../../../../domain/ObjectModule/Items/Storage/Storage';

// Dummy class para testar a classe abstrata Storage
class DummyStorage extends Storage {
  constructor() {
    super('Dummy Chest', 'A test chest', 101, 'epic', 101, 500, []);
  }
}

describe('Storage (Abstract Base)', () => {
  it('deve inicializar com a categoria "storage" e outras propriedades base', () => {
    const storage = new DummyStorage();
    
    expect(storage.name).toBe('Dummy Chest');
    expect(storage.category).toBe('storage');
    expect(storage.rarity).toBe('epic');
    expect(storage.isStackable).toBe(false);
  });
});