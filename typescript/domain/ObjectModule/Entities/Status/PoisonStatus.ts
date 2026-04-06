import type Entity from "../Entity";
import StatusEffect from "./StatusEffect";
import Vector2D from "../../../shared/Vector2D";

export default class PoisonStatus extends StatusEffect {
    constructor(duration: number, private source: Entity) { super('poison', 'Deals damage over time and reduces dodge chance.', duration, 1.0); }
    
    protected override onApply(target: Entity): void { target.attributes.dodge -= 10; } // Menos chance de esquivar (-10 flat)
    protected override onRemove(target: Entity): void { target.attributes.dodge += 10; } // Devolve o atributo quando curar
    
    protected override onTick(target: Entity): void {
        const damage = Math.max(1, this.source.attributes.intelligence * 0.3);
        target.takeDamage({ totalDamage: damage, damageType: 'nature', isCritical: false, direction: new Vector2D(0,0), attacker: this.source });
        const cx = target.coordinates.x + target.size.width / 2; const cy = target.coordinates.y + target.size.height / 2;
        (target as any).eventManager?.dispatch('particle', { effect: 'magicAura', x: cx, y: cy, color: '#32CD32' }); // Bolhas tóxicas suaves
    }
}