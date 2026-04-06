export interface Point {
    x: number;
    y: number;
}

export interface HitboxModel {
    id: string;
    type: 'polygon' | 'circle';
    coordinates: Point; // Ponto de origem (geralmente o centro ou top-left do sprite)
    rotation: number;
    
    points?: Point[]; // Usado apenas se type === 'polygon'
    radius?: number;  // Usado apenas se type === 'circle'
}