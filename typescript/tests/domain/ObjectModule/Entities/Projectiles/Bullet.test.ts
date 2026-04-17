import { describe, it, expect, vi } from 'vitest';
import Bullet from '../../../../../domain/ObjectModule/Entities/projectiles/Bullet';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class DummyBullet extends Bullet {
  constructor() {
    super(1, { x: 10, y: 10 }, { width: 5, height: 5 }, 'dummyBullet' as any, mockEventManager);
  }
  update(deltaTime: number): void {}
}

describe('Bullet (Abstract Base)', () => {
  it('deve inicializar garantindo a integridade dos DTOs base e o estado travelling', () => {
    const bullet = new DummyBullet();
    
    expect(bullet.id).toBe(1);
    expect(bullet.coordinates).toEqual({ x: 10, y: 10 });
    expect(bullet.size).toEqual({ width: 5, height: 5 });
    expect(bullet.objectId).toBe('dummyBullet');
    expect(bullet.state).toBe('travelling');
  });
});