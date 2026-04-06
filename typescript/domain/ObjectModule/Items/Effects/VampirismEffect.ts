import Effect from "./Effect";
import type Entity from "../../Entities/Entity";

export default class VampirismEffect extends Effect {
    constructor(private lifestealAmount: number) {
        super('Sede de Sangue', `Concede permanentemente ${lifestealAmount}% de Roubo de Vida.`);
    }

    public apply(target: Entity): void {
        if ('lifesteal' in target.attributes) {
            target.attributes.lifesteal = this.lifestealAmount; // Acumula no setter
            
            const attackerAny = target as any;
            if (attackerAny.eventManager) {
                const cx = target.coordinates.x + target.size.width / 2;
                const cy = target.coordinates.y + target.size.height / 2;
                attackerAny.eventManager.dispatch('particle', { effect: 'levelUp', x: cx, y: cy, color: '#8a0303' });
            }
        }
    }
}