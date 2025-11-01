// Em HitBoxCircle.ts (Assumindo que Vector2D tem os métodos necessários)
import { HitBox } from './HitBox'; 
import Vector2D from '../shared/Vector2D';
import ObjectElementManager from '../ObjectModule/ObjectElementManager';
import { globalObjectManager } from '../DomainFacade';
import CircleForm from '../ObjectModule/Entities/geometryForms/circleForm';
import type ObjectElement from '../ObjectModule/ObjectElement';


//! TODO Intersecção com polígono

export class HitBoxCircle extends HitBox {
    public radius: number;
    private objectManager:ObjectElementManager
    private visualRepresentation:ObjectElement

    constructor(coordinates: {x:number, y:number}, radius: number, rotation: number = 0) {
        super(coordinates, rotation);
        this.radius = radius;

        this.objectManager = globalObjectManager
        this.visualRepresentation = this.objectManager.spawn( id => new CircleForm(
            id,
            this.coordinates,
            {width: this.radius * 2,height: this.radius * 2},
            'normal'))
    }

    public override update(coodinates: {x:number, y:number}, rotation:number): void {
        this.updatePosition(coodinates)
        this.updateRotation(rotation)
        this.visualRepresentation.coordinates = this.coordinates
        this.visualRepresentation.rotation = this.rotation
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

    // Lógica de colisão Círculo vs Polígono Convexo Rotacionado
    // private checkCircleVsPolygon(polygon: HitBoxPolygon): boolean {
    //     const transformedVertices = polygon.getTransformedVertices();
    //     const center = this.coordinates;
    //     const radius = this.radius;

    //     for (let i = 0; i < transformedVertices.length; i++) {
    //         const p1 = transformedVertices[i];
    //         const p2 = transformedVertices[(i + 1) % transformedVertices.length]; 

    //         // Vetores usando Vector2D
    //         const edge = new Vector2D(p2.x - p1.x, p2.y - p1.y);
    //         const p1ToCenter = center.subtract(new Vector2D(p1.x, p1.y));

    //         const edgeLengthSq = edge.dot(edge); // Usa dot do Vector2D
    //         let t = 0;
            
    //         if (edgeLengthSq > 0) {
    //             t = p1ToCenter.dot(edge) / edgeLengthSq;
    //         }
            
    //         let closestPoint: Vector2D;
            
    //         if (t < 0) {
    //             closestPoint = new Vector2D(p1.x, p1.y);
    //         } else if (t > 1) {
    //             closestPoint = new Vector2D(p2.x, p2.y);
    //         } else {
    //             // Ponto mais próximo no segmento
    //             closestPoint = new Vector2D(p1.x + t * edge.x, p1.y + t * edge.y);
    //         }

    //         const distVec = center.subtract(closestPoint);
    //         const distance = distVec.magnitude(); // Usa magnitude do Vector2D

    //         if (distance <= radius) {
    //             return true; // Colisão com aresta ou vértice
    //         }
    //     }
        
    //     // Verifica se o centro do círculo está DENTRO do polígono
    //     if (this.isPointInsidePolygon(center, transformedVertices)) {
    //         return true;
    //     }
        
    //     return false;
    // }
    
    // Método auxiliar (Ray Casting) adaptado para Vector2D
    // private isPointInsidePolygon(point: Vector2D, vertices: Array<{x:number;y:number}>): boolean {
    //     let isInside = false;
    //     const n = vertices.length;
    //     for (let i = 0, j = n - 1; i < n; j = i++) {
    //         const xi = vertices[i].x, yi = vertices[i].y;
    //         const xj = vertices[j].x, yj = vertices[j].y;

    //         const intersect = ((yi > point.y) !== (yj > point.y))
    //             && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            
    //         if (intersect) isInside = !isInside;
    //     }
    //     return isInside;
    // }
}