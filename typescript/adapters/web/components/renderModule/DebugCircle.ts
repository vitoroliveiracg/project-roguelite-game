import type { HitboxDebugShape } from "../../../../domain/hitBox/HitBox";
import type IRenderable from "./IRenderable";

/**
 * Uma implementação de IRenderable específica para desenhar uma hitbox circular para depuração.
 */
export default class DebugCircle implements IRenderable {
    // Propriedades do contrato IRenderable
    id: number;
    coordinates: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number = 0;

    private radius: number;

    constructor(id: number, state: HitboxDebugShape) {
        this.id = id; // Usa o ID do objeto pai + um sufixo para unicidade
        this.coordinates = state.coordinates;
        this.radius = state.radius!;
        this.size = { width: this.radius * 2, height: this.radius * 2 };
    }

    updateState(newState: HitboxDebugShape): void {
        this.coordinates = newState.coordinates;
        this.radius = newState.radius!;
        this.size = { width: this.radius * 2, height: this.radius * 2 };
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(this.coordinates.x, this.coordinates.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Vermelho semitransparente
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}