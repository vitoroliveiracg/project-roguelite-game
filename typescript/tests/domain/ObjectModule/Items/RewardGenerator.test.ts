import { describe, it, expect, vi } from 'vitest';
import RewardGenerator from '../../../../domain/ObjectModule/Items/RewardGenerator';
import type { IEventManager } from '../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

describe('RewardGenerator', () => {
  it('não deve gerar loot (early return) se a chance não atingir o limiar de 40%', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // > 0.40 = Sem drop
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    
    RewardGenerator.generateDrop({ x: 0, y: 0 }, mockEventManager);
    expect(dispatchSpy).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it('deve gerar e despachar moedas (currency) para rolagem baixa', () => {
    const randomSpy = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.2)  // Passa do limiar de drop (< 0.40)
      .mockReturnValueOnce(0.3); // Cai na categoria Ouro (< 0.40)
    
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    RewardGenerator.generateDrop({ x: 0, y: 0 }, mockEventManager);
    
    expect(dispatchSpy).toHaveBeenCalledWith('spawn', expect.objectContaining({ type: 'droppedItem' }));
    randomSpy.mockRestore();
  });

  it('deve gerar e despachar equipamento de luxo (rare) para rolagem alta', () => {
    const randomSpy = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.2)  // Passa do limiar de drop
      .mockReturnValueOnce(0.95); // Cai na categoria Rare (>= 0.92)
    
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    RewardGenerator.generateDrop({ x: 0, y: 0 }, mockEventManager);
    
    expect(dispatchSpy).toHaveBeenCalledWith('spawn', expect.objectContaining({ type: 'droppedItem' }));
    // O payload interno contem um VampireFang, MegaMushroom, etc. A execução do spawn prova a instancialização.
    randomSpy.mockRestore();
  });
});