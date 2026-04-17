import { describe, it, expect, vi, beforeEach } from 'vitest';
import Slime from '../../../../../domain/ObjectModule/Entities/Enemies/Slime';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Player from '../../../../../domain/ObjectModule/Entities/Player/Player';

class MockEventManager implements IEventManager {
  listeners: Map<string, Function> = new Map();
  on(key: string, callback: Function) { this.listeners.set(key, callback); }
  dispatch(key: string, payload: any) {
    if (key === 'requestNeighbors' && typeof payload.callback === 'function') {
      payload.callback(payload.neighbors || []);
    }
  }
}

describe('Slime', () => {
  let slime: Slime;
  let player: Player;
  let eventManager: MockEventManager;

  beforeEach(() => {
    eventManager = new MockEventManager();
    const attrs = new Attributes(8, 1, 10, 10, 10, 10, 10, 10);
    slime = new Slime(101, 1, 10, { x: 0, y: 0 }, attrs, eventManager);
    player = new Player(1, { x: 100, y: 100 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), eventManager as any);
  });

  it('deve se mover em direção ao jogador se não houver vizinhos', () => {
    slime.update(0.16, player);
    // A velocidade deve ser positiva em direção ao jogador (100, 100)
    expect(slime.velocity.x).toBeGreaterThan(0);
    expect(slime.velocity.y).toBeGreaterThan(0);
  });

  it('deve desviar para a esquerda ou direita se a rota principal estiver bloqueada', () => {
    // Aumenta a velocidade para criar um distanciamento claro entre os vetores de desvio na simulação
    slime.attributes.speed = 500;
    
    // Posiciona o bloqueador no caminho exato da diagonal
    const blockingSlime = new Slime(102, 1, 10, { x: 28, y: 28 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), eventManager);
    
    slime.onLastPlayerPos({ x: 100, y: 100 });
    slime.moveSlime(0.16, [blockingSlime]);

    // A direção primária seria (0.707, 0.707). A rotação deve resultar em um X ou Y diferente.
    expect(slime.velocity.x).not.toBeCloseTo(slime.velocity.y, 1);
  });

  it('deve ficar parado se todas as rotas estiverem bloqueadas', () => {
    // Circunda o Slime principal para bloquear todas as rotas de desvio (-45 e +45 graus)
    const blocker1 = new Slime(102, 1, 10, { x: 15, y: 15 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), eventManager);
    const blocker2 = new Slime(103, 1, 10, { x: 0, y: 15 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), eventManager);
    const blocker3 = new Slime(104, 1, 10, { x: 15, y: 0 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), eventManager);

    slime.onLastPlayerPos({ x: 100, y: 100 });
    slime.moveSlime(0.16, [blocker1, blocker2, blocker3]);

    expect(slime.velocity.x).toBeCloseTo(0);
    expect(slime.velocity.y).toBeCloseTo(0);
  });
});