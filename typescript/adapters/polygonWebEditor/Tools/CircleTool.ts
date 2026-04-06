import type { ITool } from "./ITool";
import type { HitboxModel, Point } from "../Models/HitboxModel";

export class CircleTool implements ITool {
    private center: Point | null = null;
    private currentRadius: number = 0;

    constructor(private onComplete: (hitbox: HitboxModel) => void) {}

    public onMouseDown(e: MouseEvent, worldPos: Point, zoom: number): void {
        if (e.button === 0 && !this.center) { // Inicia o círculo
            this.center = { x: worldPos.x, y: worldPos.y };
            this.currentRadius = 0;
        }
    }

    public onMouseMove(e: MouseEvent, worldPos: Point, zoom: number): void {
        if (this.center) { // Calcula o raio enquanto arrasta
            this.currentRadius = Math.hypot(worldPos.x - this.center.x, worldPos.y - this.center.y);
        }
    }

    public onMouseUp(e: MouseEvent, worldPos: Point, zoom: number): void {
        if (e.button === 0 && this.center && this.currentRadius > 0) { // Finaliza ao soltar o clique
            const hitbox: HitboxModel = {
                id: `circle_${Date.now()}`,
                type: 'circle',
                coordinates: { x: this.center.x, y: this.center.y },
                rotation: 0,
                radius: this.currentRadius
            };
            this.onComplete(hitbox);
            this.reset();
        }
    }

    public onKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape') this.reset();
    }

    public draw(ctx: CanvasRenderingContext2D, panX: number, panY: number, zoom: number): void {
        if (this.center) {
            const px = this.center.x * zoom + panX;
            const py = this.center.y * zoom + panY;
            const screenRadius = this.currentRadius * zoom; // O raio geométrico deve escalar

            ctx.beginPath(); ctx.arc(px, py, screenRadius, 0, Math.PI * 2);
            ctx.strokeStyle = '#00FF00'; ctx.lineWidth = 2; ctx.stroke();
        }
    }

    public reset(): void {
        this.center = null;
        this.currentRadius = 0;
    }
}