import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterSpawner, SpawnRegistry, type SpawnFactory } from '../../../domain/ObjectModule/SpawnRegistry';
import { vi } from 'vitest';

describe('SpawnRegistry e @RegisterSpawner', () => {
  
  beforeEach(() => {
    SpawnRegistry.strategies.clear();
  });

  it('deve registrar uma fábrica de spawn usando o decorator @RegisterSpawner', () => {
    const mockFactory: SpawnFactory = vi.fn();

    @RegisterSpawner('test-dummy')
    class DummyObject {
      static createSpawn = mockFactory;
    }

    const factory = SpawnRegistry.strategies.get('test-dummy');
    expect(factory).toBeDefined();
    expect(factory).toBe(mockFactory);
  });

  it('deve permitir que múltiplas classes sejam registradas', () => {
    @RegisterSpawner('dummy-a')
    class DummyA { static createSpawn = vi.fn(); }

    @RegisterSpawner('dummy-b')
    class DummyB { static createSpawn = vi.fn(); }

    expect(SpawnRegistry.strategies.has('dummy-a')).toBe(true);
    expect(SpawnRegistry.strategies.has('dummy-b')).toBe(true);
    expect(SpawnRegistry.strategies.size).toBe(2);
  });
});