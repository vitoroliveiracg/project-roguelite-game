import { HitBox, type HitboxDebugShape } from './HitBox';
import type ObjectElement from '../ObjectModule/ObjectElement';

export default class HitBoxPolygon extends HitBox {
    private points: {x: number, y: number}[];
    private pivot: {x: number, y: number};
    private debugShape: HitboxDebugShape;
    
    constructor(
        coordinates: {x: number, y: number},
        rotation: number,
        points: {x: number, y: number}[],
        pivot: {x: number, y: number},
        onColision: (otherElement: ObjectElement) => void
    ) {
        super(coordinates, rotation, onColision);
        this.points = points;
        this.pivot = pivot;
        this.debugShape = { type: 'polygon', coordinates, points: [], rotation };
    }

    public getRotatedPoints(): {x: number, y: number}[] {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        
        return this.points.map(p => {
            const tx = p.x - this.pivot.x;
            const ty = p.y - this.pivot.y;

            const rx = tx * cos - ty * sin;
            const ry = tx * sin + ty * cos;

            return {
                x: this.coordinates.x + rx + this.pivot.x,
                y: this.coordinates.y + ry + this.pivot.y
            };
        });
    }

    public intersects(other: HitBox): boolean { return false; /* Delegado 100% para o CollisionWorker de alta performance */ }

    public override getDebugShape(): HitboxDebugShape {
        this.debugShape.coordinates = this.coordinates;
        this.debugShape.rotation = this.rotation;
        this.debugShape.points = this.getRotatedPoints();
        return this.debugShape;
    }
}