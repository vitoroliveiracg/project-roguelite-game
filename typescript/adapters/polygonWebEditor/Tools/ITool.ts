import type { Point } from "../Models/HitboxModel";

export interface ITool {
    onMouseDown(e: MouseEvent, worldPos: Point, zoom: number): void;
    onMouseMove(e: MouseEvent, worldPos: Point, zoom: number): void;
    onMouseUp(e: MouseEvent, worldPos: Point, zoom: number): void;
    onKeyDown(e: KeyboardEvent): void;
    draw(ctx: CanvasRenderingContext2D, panX: number, panY: number, zoom: number): void;
    reset(): void;
    onUndo?(): boolean;
    onRedo?(): boolean;
}