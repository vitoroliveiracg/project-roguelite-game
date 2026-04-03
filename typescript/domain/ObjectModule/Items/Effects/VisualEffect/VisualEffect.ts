import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents"; 

export default class VisualEffect extends Effect {
    constructor(
        private eventManager: IEventManager,
        private visualType: string,
        private duration: number,
        private size: { width: number; height: number; }
    ) {
        super('Visual Effect', 'Gera um efeito transiente puramente visual.');
    }

    public apply(target: Entity): void {
        const centerX = target.coordinates.x + (target.size.width / 2) - (this.size.width / 2);
        const centerY = target.coordinates.y + (target.size.height / 2) - (this.size.height / 2);

        this.eventManager.dispatch('spawnVisual', {
            type: this.visualType,
            coordinates: { x: centerX, y: centerY },
            duration: this.duration,
            size: this.size
        });
    }
}