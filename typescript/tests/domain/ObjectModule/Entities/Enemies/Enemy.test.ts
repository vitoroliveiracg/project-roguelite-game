import { describe, it, expect, vi, beforeEach } from 'vitest';
import Enemy from '../../../../../domain/ObjectModule/Entities/Enemies/Enemy';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import StunStatus from '../../../../../domain/ObjectModule/Entities/Status/StunStatus';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class DummyEnemy extends Enemy {
  update() {}
}

describe('Enemy (Abstract)', () => {
  let enemy: DummyEnemy;

  beforeEach(() => {
    const attrs = new Attributes(8, 1, 10, 10, 10, 10, 10, 10);
    enemy = new DummyEnemy(100, 5, 100, { x: 0, y: 0 }, 'dummy', attrs, mockEventManager);
  });

  it('deve calcular o XP concedido corretamente', () => {
    // baseXp * (1 + (level - 1) * 0.2) => 100 * (1 + 4 * 0.2) = 100 * 1.8 = 180
    expect(enemy.xpGiven).toBe(180);
  });

  describe('onStrike', () => {
    it('deve retornar um objeto Attack se o cooldown tiver passado', () => {
      const attack = enemy.onStrike();
      expect(attack).toBeInstanceOf(Attack);
    });

    it('deve retornar null se chamado dentro do cooldown', () => {
      enemy.onStrike(); // Primeira chamada, inicia o cooldown
      const attack = enemy.onStrike(); // Segunda chamada, dentro do cooldown
      expect(attack).toBeNull();
    });

    it('deve retornar null se a entidade estiver atordoada (stunned)', () => {
      enemy.applyStatus(new StunStatus(2));
      const attack = enemy.onStrike();
      expect(attack).toBeNull();
    });

    it('deve retornar um ataque novamente após o cooldown expirar', async () => {
      enemy.onStrike();
      await new Promise(resolve => setTimeout(resolve, 501)); // Espera o cooldown de 500ms
      const attack = enemy.onStrike();
      expect(attack).toBeInstanceOf(Attack);
    });
  });
});