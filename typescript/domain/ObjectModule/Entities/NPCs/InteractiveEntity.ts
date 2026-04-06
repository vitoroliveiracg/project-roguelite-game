import Entity from "../Entity";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import Attributes from "../Attributes";
import type { BdiIntention } from "../../../ports/IBdiGateway";
import { RegisterSpawner, type SpawnPayload } from "../../SpawnRegistry";

@RegisterSpawner('interactiveNpc')
export default class InteractiveEntity extends Entity {
    private currentIntention: BdiIntention | null = null;

    constructor(id: number, coordinates: { x: number, y: number }, attributes: Attributes, eventManager: IEventManager) {
        super(id, coordinates, { width: 32, height: 32 }, 'interactiveNpc', attributes, eventManager);
    }

    public setIntention(intention: BdiIntention): void {
        this.currentIntention = intention;
    }

    public override update(deltaTime: number): void {
        if (!this.currentIntention) {
            this.state = 'idle';
            return;
        }

        switch (this.currentIntention.action) {
            case 'move_to':
                if (this.currentIntention.targetPos) this.moveTo(this.currentIntention.targetPos, deltaTime);
                break;
            case 'idle':
            default:
                this.state = 'idle';
                break;
        }
    }

    private moveTo(target: { x: number, y: number }, deltaTime: number): void {
        const dx = target.x - this.coordinates.x;
        const dy = target.y - this.coordinates.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
            this.state = 'walking';
            const speed = this.attributes.speed * deltaTime;
            this.coordinates.x += (dx / dist) * speed;
            this.coordinates.y += (dy / dist) * speed;
        } else {
            this.state = 'idle';
        }
    }

    public static createSpawn(id: number, payload: SpawnPayload, eventManager: IEventManager): InteractiveEntity {
        return new InteractiveEntity(id, payload.coordinates, payload.attributes || new Attributes(5, 1, 5, 5, 5, 5, 5, 5), eventManager);
    }
}