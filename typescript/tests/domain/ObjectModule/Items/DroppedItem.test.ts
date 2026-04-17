import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DroppedItem from '../../../../domain/ObjectModule/Items/DroppedItem';
import Item from '../../../../domain/ObjectModule/Items/Item';
import Player from '../../../../domain/ObjectModule/Entities/Player/Player';
import Attributes from '../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class DummyItem extends Item {
  constructor(rarity: any = 'common', category: any = 'weapon') {
    super('Dummy Sword', 'desc', 1, rarity, category, 1, 10, false, 1, 100, []);
  }
}

class DummyCoin extends Item {
  constructor() {
    super('Gold', 'desc', 2, 'common', 'currency', 2, 10, true, 99, 100, []);
  }
  use = vi.fn();
}

describe('DroppedItem', () => {
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    player = new Player(1, { x: 0, y: 0 }, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve despachar partícula de farol lendário se o item for raro/épico/lendário', () => {
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    const epicItem = new DummyItem('epic');
    const dropped = new DroppedItem(100, { x: 0, y: 0 }, epicItem, mockEventManager);

    vi.advanceTimersByTime(0);

    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({
      effect: 'legendaryLootBeacon'
    }));
  });

  it('deve adicionar item à mochila do jogador e despawnar ao colidir', () => {
    const normalItem = new DummyItem();
    const dropped = new DroppedItem(100, { x: 0, y: 0 }, normalItem, mockEventManager);
    const despawnSpy = vi.spyOn(mockEventManager, 'dispatch');

    dropped.hitboxes![0]!.onColision(player);

    expect(player.backpack.length).toBe(1);
    expect(player.backpack[0]).toBe(normalItem);
    expect(despawnSpy).toHaveBeenCalledWith('despawn', { objectId: 100 });
  });

  it('deve auto-consumir moedas (currency) sem ocupar espaço na mochila', () => {
    const coin = new DummyCoin();
    const dropped = new DroppedItem(100, { x: 0, y: 0 }, coin, mockEventManager);
    const despawnSpy = vi.spyOn(mockEventManager, 'dispatch');

    dropped.hitboxes![0]!.onColision(player);

    expect(coin.use).toHaveBeenCalledWith(player);
    expect(player.backpack.length).toBe(0); // Não foi para a mochila
    expect(despawnSpy).toHaveBeenCalledWith('despawn', { objectId: 100 });
  });

  it('não deve coletar o item se a mochila estiver cheia', () => {
    const normalItem = new DummyItem();
    const dropped = new DroppedItem(100, { x: 0, y: 0 }, normalItem, mockEventManager);
    Object.defineProperty(player, 'maxBackpackSize', { value: 0, configurable: true }); // Mochila de tamanho 0

    dropped.hitboxes![0]!.onColision(player);
    expect(player.backpack.length).toBe(0);
  });

  it('Métrica 4: Regressão Idempotente (Não deve duplicar item no inventário em dupla colisão atrasada)', () => {
    const normalItem = new DummyItem();
    const dropped = new DroppedItem(100, { x: 0, y: 0 }, normalItem, mockEventManager);
    const despawnSpy = vi.spyOn(mockEventManager, 'dispatch');

    // Frame N: Primeira colisão capturada pelo Worker de Física
    dropped.hitboxes![0]!.onColision(player);

    expect(player.backpack.length).toBe(1);
    expect(despawnSpy).toHaveBeenCalledWith('despawn', { objectId: 100 });

    // Frame N+1: O Game Loop sofreu Stuttering, o objeto não limpou o Render e colidiu no mesmo pixel de novo
    dropped.hitboxes![0]!.onColision(player);

    // Asserção Crítica: O inventário DEVE manter apenas 1 item (Requer uma flag isCollected interna para early return)
    expect(player.backpack.length).toBe(1);
  });
});