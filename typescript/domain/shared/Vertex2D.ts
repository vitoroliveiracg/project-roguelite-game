export class Vertex2D {
    constructor (
        public dot: {x:number;y:number},
        public conections: {parent1: Vertex2D, parent2: Vertex2D} | null = null
    ){}
}