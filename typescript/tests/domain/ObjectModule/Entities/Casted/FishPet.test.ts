import { describe, it, expect, vi, beforeEach } from 'vitest';
import FishPet from '../../../../../domain/ObjectModule/Entities/Casted/FishPet';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Player from '../../../../../domain/ObjectModule/Entities/Player/Player';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

describe('FishPet', () => {
  let player: Player;

  beforeEach(() => {
    player = new Player(1, { x: 100, y: 100 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
    vi.clearAllMocks();
  });

  it('deve seguir o jogador se estiver longe', () => {
    const pet = new FishPet(101, { x: 0, y: 0 }, mockEventManager);
    pet.update(0.16, player);

    // O pet deve se mover em direção ao jogador
    expect(pet.velocity.x).toBeGreaterThan(0);
    expect(pet.velocity.y).toBeGreaterThan(0);
  });

  it('deve ficar parado se estiver perto do jogador', () => {
    const pet = new FishPet(101, { x: 90, y: 90 }, mockEventManager);
    pet.update(0.16, player);

    // O pet está dentro do raio de 40, então não deve se mover
    expect(pet.velocity.x).toBe(0);
    expect(pet.velocity.y).toBe(0);
  });

  it('deve se destruir após seu tempo de vida expirar', () => {
    const pet = new FishPet(101, { x: 0, y: 0 }, mockEventManager);
    const destroySpy = vi.spyOn(pet as any, 'destroy');

    pet.update(5.1); // Tempo de vida é 5.0s

    expect(destroySpy).toHaveBeenCalledOnce();
  });

  it('deve ser imortal (não tomar dano)', () => {
    const pet = new FishPet(101, { x: 0, y: 0 }, mockEventManager);
    const initialHp = pet.attributes.hp;

    const damageDealt = pet.takeDamage({ totalDamage: 999, damageType: 'physical' } as any);

    expect(damageDealt).toBe(0);
    expect(pet.attributes.hp).toBe(initialHp);
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('particle', expect.any(Object));
  });
});