import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// @ts-ignore - Suprime erro de tipagem de lib nativa caso @types/node não esteja no workspace
import { createHash } from 'crypto';
import { EventHandler } from '../../domain/eventDispacher/eventDispacher';
import ObjectElementManager from '../../domain/ObjectModule/ObjectElementManager';
import type { ICollisionService } from '../../domain/ports/ICollisionService';
import Player from '../../domain/ObjectModule/Entities/Player/Player';
import Attributes from '../../domain/ObjectModule/Entities/Attributes';
import { SpawnRegistry } from '../../domain/ObjectModule/SpawnRegistry';
import Entity from '../../domain/ObjectModule/Entities/Entity'; 
import Vector2D from '../../domain/shared/Vector2D';

class FakeCollisionWorker implements ICollisionService {
  async checkCollisions(): Promise<Int32Array> { return new Int32Array([]); }
}

class DummyEnemy extends Entity {
  constructor(id: number, eventManager: any) {
    super(id, { x: 50, y: 50 }, { width: 10, height: 10 }, 'enemy', new Attributes(8, 1, 10, 10, 10, 10, 10, 10), eventManager);
  }
  update(deltaTime: number) { this.move(deltaTime); }
}

describe('Métrica 12: Detecção de Desync (Determinismo Numérico e Arquitetural)', () => {
  beforeEach(() => {
    // Fixamos a semente RNG (Dado) para garantir que rolagens e trajetórias cinemáticas
    // sejam 100% iguais e matemáticas a cada execução do CI.
    vi.spyOn(Math, 'random').mockReturnValue(0.42);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve gerar exatamente o mesmo Checksum (SHA-256) do Estado Mundial após 120 frames contínuos', () => {
    const eventBus = new EventHandler();
    const collisionWorker = new FakeCollisionWorker();
    const engineManager = new ObjectElementManager(eventBus, collisionWorker);
    engineManager.setWorldBounds(1000, 1000);

    SpawnRegistry.strategies.set('dummyEnemy', (id, _payload, em) => new DummyEnemy(id, em));

    const player = new Player(1, { x: 0, y: 0 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), eventBus);
    const enemy1 = engineManager.spawn(id => new DummyEnemy(id, eventBus));
    const enemy2 = engineManager.spawn(id => new DummyEnemy(id, eventBus));

    enemy1.velocity = new Vector2D(10, 0); // Vão andar 10px / seg
    enemy2.velocity = new Vector2D(0, 15); // Vão andar 15px / seg

    // Loop de simulação determinística: 120 Ticks = 2 Segundos Reais cravados no tempo do Domínio
    for (let i = 1; i <= 120; i++) {
      // No frame 60 cravado, injetamos um input rigoroso do jogador forçando sua Cinemática Y = -160/s
      if (i === 60) player.onUpAction(); 

      engineManager.updateAll(0.016, player);
      player.update(0.016);
    }

    // Construção do Snapshot Determinístico do Mundo
    const rawState = {
      p: { x: player.coordinates.x, y: Number(player.coordinates.y.toFixed(3)), hp: player.attributes.hp },
      e: Array.from((engineManager as any).elements.values()).map((el: any) => ({
        id: el.id,
        x: Number(el.coordinates.x.toFixed(3)), // Prevenindo desvios microscópicos de Float (IEEE 754)
        y: Number(el.coordinates.y.toFixed(3))
      }))
    };

    const stateString = JSON.stringify(rawState);
    const currentHash = createHash('sha256').update(stateString).digest('hex');

    // Master Hash / Golden Run
    // Se alguém mexer nas engrenagens de "Vector2D" ou inverter a iteração do Loop, 
    // o Checksum será alterado. Este Hash sela a arquitetura matematicamente.
    const expectedHash = 'ac7e5d6ebdbb09da311b63e8203e14c5581de2a400c89f7cd65dae8fb0c9f3d0';
    expect(currentHash).toBe(expectedHash);
  });
});