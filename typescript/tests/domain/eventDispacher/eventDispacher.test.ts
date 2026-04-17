import { describe, it, expect, vi } from 'vitest';
import { EventHandler } from '../../../domain/eventDispacher/eventDispacher';

describe('EventHandler', () => {
  it('deve registrar e disparar um evento corretamente', () => {
    const handler = new EventHandler();
    const mockCallback = vi.fn();
    
    handler.on('playerDied', mockCallback);
    handler.dispatch('playerDied', {});
    
    expect(mockCallback).toHaveBeenCalledOnce();
    expect(mockCallback).toHaveBeenCalledWith({});
  });

  it('deve disparar um evento log automaticamente para eventos gerais', () => {
    const handler = new EventHandler();
    const mockLogCallback = vi.fn();
    
    handler.on('log', mockLogCallback);
    handler.dispatch('spawn', { type: 'test', coordinates: { x: 0, y: 0 } } as any);
    
    expect(mockLogCallback).toHaveBeenCalledOnce();
    expect(mockLogCallback).toHaveBeenCalledWith(expect.objectContaining({
      channel: 'events',
      message: '[EventDispatcher] Disparado: spawn'
    }));
  });

  it('não deve disparar um evento log para eventos frequentes (ex: playerMoved)', () => {
    const handler = new EventHandler();
    const mockLogCallback = vi.fn();
    
    handler.on('log', mockLogCallback);
    handler.dispatch('playerMoved', { x: 10, y: 10 });
    
    expect(mockLogCallback).not.toHaveBeenCalled();
  });
  
  it('não deve causar loop infinito ao disparar o evento de log diretamente', () => {
    const handler = new EventHandler();
    const mockLogCallback = vi.fn();
    handler.on('log', mockLogCallback);
    handler.dispatch('log', { channel: 'test', message: 'test message', params: [] });
    expect(mockLogCallback).toHaveBeenCalledOnce();
  });

  it('Métrica 14: deve monitorar a Profundidade de Cascata (Cascade Depth) e estourar erro protegendo o Loop contra Spaghetti de Eventos', () => {
    const handler = new EventHandler();
    
    // Simulando uma cadeia de dependência invisível mal estruturada: A -> B -> C -> D -> A
    handler.on('A' as any, () => handler.dispatch('B' as any, {}));
    handler.on('B' as any, () => handler.dispatch('C' as any, {}));
    handler.on('C' as any, () => handler.dispatch('D' as any, {}));
    handler.on('D' as any, () => handler.dispatch('A' as any, {})); // Fio terra do Loop Infinito

    // O Dispatcher rigoroso deve rastrear a call stack efêmera e ejetar a execução
    // se a profundidade da mesma árvore de dispatch for maior que a tolerância arquitetural.
    expect(() => {
      handler.dispatch('A' as any, {});
    }).toThrow(/Cascade Depth|Maximum call stack/i);
    // Nota de Implementação: O seu `EventHandler` precisa agora ter um `private depth = 0;` 
    // que incrementa a cada .dispatch e decrementa ao final, lançando um erro se depth > 5.
  });
});
