// Em HitBoxCircle.ts (Assumindo que Vector2D tem os métodos necessários)
import { HitBox, type HitboxDebugShape } from './HitBox'; 
import Vector2D from '../shared/Vector2D';
import ObjectElementManager from '../ObjectModule/ObjectElementManager';
import type ObjectElement from '../ObjectModule/ObjectElement';


//! TODO Intersecção com polígono

export class HitBoxCircle extends HitBox {

    constructor(
        coordinates: {x:number, y:number}, 
        rotation: number = 0,
        onColision: (otherElement: ObjectElement, selfElement: ObjectElement) => void,
        private radius: number,
    ) 
    {
        super( coordinates, rotation, onColision );

    }

    public override update(coodinates: {x:number, y:number}, rotation:number): void {
        this.updatePosition(coodinates)
        this.updateRotation(rotation)
    }

    //! Está funcionando apenas para intersecções do tipo: (HitBoxCircle <-> HitBoxCircle) 
    public intersects(other: HitBox): boolean {
        if (other instanceof HitBoxCircle) {
            const otherVector = new Vector2D(other.coordinates.x,other.coordinates.y)
            const thisVector = new Vector2D(this.coordinates.x, this.coordinates.y)
            const diff = thisVector.subtract(otherVector).clone(); 
            const distanceSquared = diff.dot(diff); // Usa dot do Vector2D
            
            const radiiSum = this.radius + other.radius;
            return distanceSquared <= (radiiSum * radiiSum);
        }
        
        // if (other instanceof HitBoxPolygon) {
        //     return this.checkCircleVsPolygon(other);
        // }
        
        return false;
    }

    public override getDebugShape(): HitboxDebugShape {
        return {
            type: 'circle',
            coordinates: this.coordinates,
            radius: this.radius,
        };
    }
}