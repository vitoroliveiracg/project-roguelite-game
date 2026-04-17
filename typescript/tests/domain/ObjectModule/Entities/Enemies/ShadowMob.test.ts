import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShadowMob from '../../../../../domain/ObjectModule/Entities/Enemies/ShadowMob';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Player from '../../../../../domain/ObjectModule/Entities/Player/Player';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

describe('ShadowMob', () => {
  let shadowMob: ShadowMob;
  let player: Player;

  beforeEach(() => {
    const attrs = new Attributes(8, 1, 10, 10, 10, 10, 10, 10);
    shadowMob = new ShadowMob(101, { x: 0, y: 0 }, attrs, mockEventManager);
    player = new Player(1, { x: 100, y: 100 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
    vi.clearAllMocks();
  });

  it('deve seguir o jogador', () => {
    shadowMob.update(0.16, player);

    // A velocidade deve ser positiva em direção ao jogador
    expect(shadowMob.velocity.x).toBeGreaterThan(0);
    expect(shadowMob.velocity.y).toBeGreaterThan(0);
  });

  it('deve atacar o jogador ao colidir', () => {
    const applyStatusSpy = vi.spyOn(player, 'applyStatus');
    const takeDamageSpy = vi.spyOn(player, 'takeDamage');

    // Simula a colisão
    shadowMob.hitboxes![0]!.onColision(player);

    expect(takeDamageSpy).toHaveBeenCalledOnce();
    // O ataque do ShadowMob sempre aplica um status
    expect(applyStatusSpy).toHaveBeenCalledOnce();
  });

  it('deve respeitar o cooldown de ataque', () => {
    const takeDamageSpy = vi.spyOn(player, 'takeDamage');

    shadowMob.hitboxes![0]!.onColision(player); // Primeiro ataque
    shadowMob.hitboxes![0]!.onColision(player); // Segundo ataque (dentro do cooldown)

    expect(takeDamageSpy).toHaveBeenCalledOnce();
  });
});