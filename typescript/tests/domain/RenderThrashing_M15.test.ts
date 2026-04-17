import { describe, it, expect } from 'vitest';
import type { EntityRenderableState } from '../../domain/ports/domain-contracts';

// Emulação estrita do módulo syncRenderables (futuro SceneManager) com rastreamento O(1)
class RenderThrashingDetector {
    private lastStates = new Map<number, EntityRenderableState>();
    public ignoredUpdates = 0;
    public acceptedUpdates = 0;

    public syncRenderables(newStates: EntityRenderableState[]) {
        for (const newState of newStates) {
            const lastState = this.lastStates.get(newState.id);
            
            // Checagem de Igualdade (Short-circuit): Evita reescrever as matrizes de Z-Index da GPU atoa
            if (lastState && 
                lastState.coordinates.x === newState.coordinates.x && 
                lastState.coordinates.y === newState.coordinates.y && 
                lastState.state === newState.state) {
                this.ignoredUpdates++;
                continue; // Pula o processamento pesado (Render Thrashing Evitado!)
            }

            // Atualiza a sombra do frame anterior e submete para renderização (Shallow Copy limpa)
            this.lastStates.set(newState.id, { ...newState, coordinates: { ...newState.coordinates } });
            this.acceptedUpdates++;
        }
    }
}

describe('Métrica 15: Coeficiente de Mutação Inútil (Render Thrashing)', () => {
    it('deve ignorar DTOs espaciais idênticos e incrementar o contador de rejeição (Zero-Waste GPU)', () => {
        const renderer = new RenderThrashingDetector();
        
        const dummyDTO: EntityRenderableState = {
            id: 1, entityTypeId: 'molor', state: 'idle',
            coordinates: { x: 100, y: 100 }, size: { width: 16, height: 16 },
            rotation: 0
        };

        renderer.syncRenderables([dummyDTO]); // Frame 1: Entidade spawna (Processado)
        renderer.syncRenderables([dummyDTO]); // Frame 2: Entidade continua parada (Ignorado!)
        
        dummyDTO.coordinates.x = 105;
        renderer.syncRenderables([dummyDTO]); // Frame 3: Entidade se moveu (Processado)
        
        expect(renderer.acceptedUpdates).toBe(2);
        expect(renderer.ignoredUpdates).toBe(1); // 33% de economia computacional
    });
});