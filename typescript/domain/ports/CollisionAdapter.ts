import type { ICollisionService } from "./ICollisionService";

export class CollisionAdapter implements ICollisionService {
    private worker: Worker;
    private isChecking: boolean = false;

    constructor() {
        this.worker = new Worker(new URL('../ObjectModule/Collision.worker.ts', import.meta.url), { type: 'module' });
    }

    public checkCollisions(hitboxData: Float32Array, bufferLength: number, worldBounds: { x: number, y: number, width: number, height: number }): Promise<Int32Array> {
        return new Promise((resolve) => {
            if (this.isChecking) { resolve(new Int32Array(0)); return; }
            this.isChecking = true;

            this.worker.onmessage = (event: MessageEvent<Int32Array>) => {
                this.isChecking = false;
                resolve(event.data);
            };
            this.worker.postMessage({ hitboxData, bufferLength, worldBounds });
        });
    }
}