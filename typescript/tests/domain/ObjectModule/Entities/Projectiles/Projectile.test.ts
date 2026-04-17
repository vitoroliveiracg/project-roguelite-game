import { describe, it, expect, vi, beforeEach } from 'vitest';
import Projectile from '../../../../../domain/ObjectModule/Entities/projectiles/Projectile';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Vector2D from '../../../../../domain/shared/Vector2D';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

// Implementação Dummy para acessar a abstração
class DummyProjectile extends Projectile {
  constructor() {
    super(1, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, mockEventManager);
  }
  
  public setVelocity(v: Vector2D) {
    this.velocity = v;
  }

  update(deltaTime: number): void {
    this.move(deltaTime);
  }
}

describe('Projectile (Abstract Base)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve calcular o deslocamento vetorial via move() multiplicando a velocidade pelo deltaTime', () => {
    const proj = new DummyProjectile();
    proj.setVelocity(new Vector2D(100, 50));
    
    proj.update(0.5); // Avança meio segundo (deltaTime = 0.5)

    // Deslocamento = (100 * 0.5, 50 * 0.5) = (50, 25)
    expect(proj.coordinates.x).toBe(50);
    expect(proj.coordinates.y).toBe(25);
  });
});