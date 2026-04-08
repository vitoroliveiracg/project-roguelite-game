import Vector2D from "../../../shared/Vector2D";
import ObjectElement from "../../ObjectElement";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type { objectTypeId } from "../../objectType.type";

export type projectileStates = 'travelling' | 'stopped' | 'launched';

export default abstract class Projectile extends ObjectElement {
    protected velocity: Vector2D = new Vector2D(0, 0);
    public direction: Vector2D = new Vector2D(0, 0);

    constructor(
        id: number,
        coordinates: { x: number; y: number; },
        size: { width: number; height: number; },
        objectId: objectTypeId,
        eventManager: IEventManager,
        state: projectileStates = 'travelling',
    ) { 
        super(size, coordinates, id, objectId, eventManager, state);
    }

    public move(deltaTime: number): void {
        this.velocity.multiplyMut(deltaTime);
        this.eventManager.dispatch('log', { channel: 'domain-entity-move', message: `(Projectile) ${this.id}-${this.objectId} moved`, params: [] });
        this.updatePosition();
    }

    protected updatePosition(): void {
        super.coordinates.x += this.velocity.x;
        super.coordinates.y += this.velocity.y;
    }

    public abstract override update(deltaTime: number): void;
}