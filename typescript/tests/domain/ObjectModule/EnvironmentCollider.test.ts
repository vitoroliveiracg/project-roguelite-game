import { describe, it, expect, vi } from 'vitest';
import EnvironmentCollider from '../../../domain/ObjectModule/EnvironmentCollider';
import type { IEventManager } from '../../../domain/eventDispacher/IGameEvents';
import { HitBoxCircle } from '../../../domain/hitBox/HitBoxCircle';
import type { SpawnPayload } from '../../../domain/ObjectModule/SpawnRegistry';

const mockEventManager: IEventManager = {
  on: vi.fn(),
  dispatch: vi.fn(),
};

describe('EnvironmentCollider', () => {
  it('deve construir com o estado "static"', () => {
    const collider = new EnvironmentCollider(1, { x: 0, y: 0 }, { width: 10, height: 10 }, mockEventManager, []);
    expect(collider.state).toBe('static');
  });

  it('deve ter um método update vazio que não lança erros', () => {
    const collider = new EnvironmentCollider(1, { x: 0, y: 0 }, { width: 10, height: 10 }, mockEventManager, []);
    expect(() => collider.update(0.16)).not.toThrow();
  });

  describe('createSpawn (Factory)', () => {
    it('deve criar uma instância a partir de um payload', () => {
      const hitboxes = [new HitBoxCircle({ x: 50, y: 50 }, 0, 10, vi.fn())];
      const payload: SpawnPayload = {
        type: 'environmentCollider',
        coordinates: { x: 100, y: 100 },
        size: { width: 20, height: 20 },
        hitboxes: hitboxes,
      };

      const collider = EnvironmentCollider.createSpawn(123, payload, mockEventManager);

      expect(collider).toBeInstanceOf(EnvironmentCollider);
      expect(collider.id).toBe(123);
      expect(collider.coordinates).toEqual({ x: 100, y: 100 });
      expect(collider.size).toEqual({ width: 20, height: 20 });
      expect(collider.hitboxes).toBe(hitboxes);
    });
  });
});