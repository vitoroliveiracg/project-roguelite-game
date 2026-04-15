import type { EntityRenderableState, WorldState } from "../../../../../domain/ports/domain-contracts";
import type Canvas from "./Canvas";
import type { AnimationManager } from "../visuals/AnimationManager";

/**
 * Define o contrato para qualquer renderizador no jogo.
 * Isso permite que o GameAdapter alterne entre diferentes tecnologias de renderização
 * (como WebGPU e Canvas 2D) de forma transparente.
 */
export default interface IRenderer<T> {
    canvas: Canvas;

    initialize(): Promise<void>;

    clear(): void;

    drawFrame(domainState: { world: WorldState; renderables: readonly T[] }, cameraTarget: EntityRenderableState | undefined, animationManagers?: Map<number, AnimationManager>, map?: any): Promise<void>;
}