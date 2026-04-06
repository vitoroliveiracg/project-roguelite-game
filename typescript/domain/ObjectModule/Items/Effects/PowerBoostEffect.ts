import Effect from "./Effect";
import type Entity from "../../Entities/Entity";

export default class PowerBoostEffect extends Effect {
    constructor(private strengthAmount: number) {
        super('Poder Brutal', `Queima suas veias, injetando +${strengthAmount} de Força.`);
    }

    public apply(target: Entity): void {
        target.attributes.strength += this.strengthAmount;
        
        const attackerAny = target as any;
        if (attackerAny.eventManager) {
            const cx = target.coordinates.x + target.size.width / 2;
            const cy = target.coordinates.y + target.size.height / 2;
            attackerAny.eventManager.dispatch('particle', { effect: 'fireExplosion', x: cx, y: cy });
        }
    }
}