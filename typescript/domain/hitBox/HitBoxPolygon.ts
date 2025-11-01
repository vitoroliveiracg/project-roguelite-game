import { Vertex2DMesh } from '../shared/Vertex2DMesh'; 
import { HitBox } from './HitBox'; 
import Vector2D from '../shared/Vector2D';
import { HitBoxCircle } from './HitBoxCircle';
import { Vertex2D } from '../shared/Vertex2D';



//! TODO (Classe incompleta)

/**
 * HitBox na forma de um polígono convexo.
 */
export class HitBoxPolygon extends HitBox {
    public vertexMesh: Vertex2DMesh; 

    /**
     *      * @param coordinates Ponto central da HitBox.
     * @param localVertices Vertices relativos ao ponto de referencia `coordinates` da HitBox.
     * @param rotation Rotação da HitBox, inicialmente como 0.
     */
    constructor(
        coordinates: Vector2D, // Mudado para Vector2D para consistência
        verticesData: Array<{x:number;y:number}>, // Mantido como {x, y} simples para criar os V2D temporários
        rotation:number = 0
    ) {
        super(coordinates, rotation);
        
        // Criamos a malha a partir dos dados de vértices brutos
        const vertices2D = verticesData.map(v => new Vertex2D(v));
        this.vertexMesh = new Vertex2DMesh(vertices2D);
    }
    
    public override updatePosition(vectorDelta: Vector2D): void {
        this.coordinates.add(vectorDelta);
    }

    /**
     * Obtém os vértices transformados (posição + rotação) no sistema de coordenadas do mundo.
     * @returns Um array de coordenadas {x, y} no sistema de coordenadas do mundo.
     */
    public getTransformedVertices(): Array<{x:number;y:number}> {
        const transformed: Array<{x:number;y:number}> = [];
        const cosR = Math.cos(this.rotation);
        const sinR = Math.sin(this.rotation);

        // Iteramos sobre a malha de vértices
        for (const v2d of this.vertexMesh.mesh) {
            const v = v2d.dot; // O ponto {x, y}
            
            // 1. Rotação
            const rotatedX = v.x * cosR - v.y * sinR;
            const rotatedY = v.x * sinR + v.y * cosR;
            
            // 2. Translação
            transformed.push({
                x: this.coordinates.x + rotatedX,
                y: this.coordinates.y + rotatedY
            });
        }
        return transformed;
    }

    public intersects(other: HitBox): boolean {
        if (other instanceof HitBoxCircle) {
            return other.intersects(this); 
        }
        
        if (other instanceof HitBoxPolygon) {
            // Implementação SAT (Placeholder)
            console.warn("Verificação de colisão Polygon vs Polygon (SAT) não implementada.");
            return false; 
        }

        return false;
    }
}