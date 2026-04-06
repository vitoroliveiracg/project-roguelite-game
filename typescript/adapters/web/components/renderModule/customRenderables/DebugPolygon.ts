import type { HitboxDebugShape } from "../../../../../domain/hitBox/HitBox";
import type IRenderable from "../visuals/IRenderable";

export default class DebugPolygon implements IRenderable {
    id: number;
    coordinates: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    points: { x: number; y: number }[];

    constructor(id: number, state: HitboxDebugShape) {
        this.id = id; 
        this.coordinates = state.coordinates;
        this.rotation = state.rotation || 0;
        this.points = state.points || [];
        this.size = { width: 0, height: 0 };
    }

    updateState(newState: HitboxDebugShape): void {
        this.coordinates = newState.coordinates;
        this.rotation = newState.rotation || 0;
        this.points = newState.points || [];
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.points.length === 0) return;
        
        ctx.beginPath();
        ctx.moveTo(this.points[0]!.x, this.points[0]!.y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i]!.x, this.points[i]!.y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}