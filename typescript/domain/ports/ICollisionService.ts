export interface ICollisionService {
    // Envia o array bruto [id, x, y, radius, id, x, y, radius...] para a Web
    checkCollisions(hitboxData: Float32Array, hitboxCount: number, worldBounds: { x: number, y: number, width: number, height: number }): Promise<Int32Array>;
}