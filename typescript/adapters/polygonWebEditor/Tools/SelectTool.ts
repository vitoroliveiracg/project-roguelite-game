import type { ITool } from "./ITool";
import type { HitboxModel, Point } from "../Models/HitboxModel";

export class SelectTool implements ITool {
    private selectedTarget: { point: Point, hitbox: HitboxModel } | null = null;
    private hoverTarget: { point: Point, hitbox: HitboxModel } | null = null;

    // Recebe a referência do array principal de hitboxes para poder editá-las diretamente
    constructor(private hitboxes: HitboxModel[], private onChange: () => void) {}

    private getTargetAt(x: number, y: number, zoom: number): { point: Point, hitbox: HitboxModel } | null {
        const threshold = Math.max(1, 8 / zoom);
        // Procura do fim pro começo para pegar as hitboxes desenhadas por cima
        for (let i = this.hitboxes.length - 1; i >= 0; i--) {
            const hb = this.hitboxes[i]!;
            if (hb.type === 'polygon' && hb.points) {
                for (const p of hb.points) {
                    if (Math.hypot(p.x - x, p.y - y) < threshold) return { point: p, hitbox: hb };
                }
            } else if (hb.type === 'circle') {
                if (Math.hypot(hb.coordinates.x - x, hb.coordinates.y - y) < threshold) return { point: hb.coordinates, hitbox: hb };
            }
        }
        return null;
    }

    public onMouseDown(e: MouseEvent, worldPos: Point, zoom: number): void {
        const target = this.getTargetAt(worldPos.x, worldPos.y, zoom);
        
        if (e.button === 0) { // Clique Esquerdo: Seleciona para arrastar
            this.selectedTarget = target;
        } else if (e.button === 2 && target) { // Clique Direito: Deletar Ponto ou Hitbox
            if (target.hitbox.type === 'polygon' && target.hitbox.points) {
                const ptIdx = target.hitbox.points.indexOf(target.point);
                if (ptIdx > -1) {
                    if (target.hitbox.points.length > 3) {
                        target.hitbox.points.splice(ptIdx, 1); // Remove só o vértice
                    } else {
                        const hbIdx = this.hitboxes.indexOf(target.hitbox);
                        if (hbIdx > -1) this.hitboxes.splice(hbIdx, 1); // Remove o triângulo inteiro
                    }
                    this.onChange(); // Salva o estado após apagar vértice/polígono
                }
            } else if (target.hitbox.type === 'circle') {
                const hbIdx = this.hitboxes.indexOf(target.hitbox);
                if (hbIdx > -1) this.hitboxes.splice(hbIdx, 1); // Remove o círculo
                this.onChange(); // Salva o estado após apagar o círculo
            }
        }
    }

    public onMouseMove(e: MouseEvent, worldPos: Point, zoom: number): void {
        this.hoverTarget = this.getTargetAt(worldPos.x, worldPos.y, zoom);
        
        if (this.selectedTarget) { // Arrastando o ponto
            this.selectedTarget.point.x = worldPos.x;
            this.selectedTarget.point.y = worldPos.y;
        }
    }

    public onMouseUp(e: MouseEvent, worldPos: Point, zoom: number): void {
        if (this.selectedTarget) {
            this.onChange(); // Salva o estado após soltar um ponto que foi arrastado
        }
        this.selectedTarget = null;
    }

    public onKeyDown(e: KeyboardEvent): void {}

    public draw(ctx: CanvasRenderingContext2D, panX: number, panY: number, zoom: number): void {
        if (this.hoverTarget && !this.selectedTarget) {
            const px = this.hoverTarget.point.x * zoom + panX;
            const py = this.hoverTarget.point.y * zoom + panY;

            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#FFF';
            ctx.stroke();
        }
    }

    public reset(): void {
        this.selectedTarget = null;
    }
}