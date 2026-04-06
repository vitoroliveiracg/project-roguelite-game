import type { IEventManager } from "../eventDispacher/IGameEvents";
import type { WorldState } from "../ports/domain-contracts";

export default abstract class GameWorld {
    public abstract readonly mapId: string;
    public abstract readonly width: number;
    public abstract readonly height: number;
    public abstract readonly chunkSize: number;
    public abstract readonly chunks: string[][];

    constructor(protected eventManager: IEventManager) {}

    /**
     * Método responsável por orquestrar a montagem do mundo
     * (instanciar colisores invisíveis, inimigos locais, baús, etc).
     */
    public abstract generate(): void;

    public getState(): WorldState {
        return { width: this.width, height: this.height, mapId: this.mapId, chunkSize: this.chunkSize, chunks: this.chunks };
    }
}