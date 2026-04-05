import type IRenderable from "../visuals/IRenderable";
import type { RenderAnchor } from "../visuals/GameObjectElement";

export default class DebugRectangle implements IRenderable {
    id: number;
    coordinates: { x: number; y: number };
    size: { width: number; height: number };
    rotation: number;
    private anchor?: RenderAnchor | undefined;
    private rotationOffset: number;
    
    constructor(id: number, state: any, anchor?: RenderAnchor, rotationOffset: number = 0) {
        this.id = id;
        this.coordinates = state.coordinates;
        this.size = state.size;
        this.rotation = state.rotation || 0;
        this.anchor = anchor;
        this.rotationOffset = rotationOffset;
    }

    updateState(newState: any): void {
        this.coordinates = newState.coordinates;
        this.size = newState.size;
        this.rotation = newState.rotation || 0;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        
        let pivotX = this.coordinates.x + this.size.width / 2;
        let pivotY = this.coordinates.y + this.size.height / 2;

        if (this.anchor) {
            switch(this.anchor) {
                case 'bottom-left': pivotX = this.coordinates.x; pivotY = this.coordinates.y + this.size.height; break;
                case 'bottom-right': pivotX = this.coordinates.x + this.size.width; pivotY = this.coordinates.y + this.size.height; break;
                case 'top-left': pivotX = this.coordinates.x; pivotY = this.coordinates.y; break;
                case 'top-right': pivotX = this.coordinates.x + this.size.width; pivotY = this.coordinates.y; break;
                case 'center-left': pivotX = this.coordinates.x; pivotY = this.coordinates.y + this.size.height / 2; break;
                case 'center-right': pivotX = this.coordinates.x + this.size.width; pivotY = this.coordinates.y + this.size.height / 2; break;
                case 'top-center': pivotX = this.coordinates.x + this.size.width / 2; pivotY = this.coordinates.y; break;
                case 'bottom-center': pivotX = this.coordinates.x + this.size.width / 2; pivotY = this.coordinates.y + this.size.height; break;
            }
        }

        ctx.translate(pivotX, pivotY);
        ctx.rotate(this.rotation + this.rotationOffset);
        ctx.translate(-pivotX, -pivotY);

        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(this.coordinates.x, this.coordinates.y, this.size.width, this.size.height);

        ctx.fillStyle = 'magenta';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'magenta';
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        ctx.lineTo(pivotX + 25, pivotY);
        ctx.stroke();

        ctx.restore();
    }
}