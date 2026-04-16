import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import Vector2D from "../../../../shared/Vector2D";

export default class GroundEffect extends Effect {
    constructor(private source: Entity) { super('Ground', 'Atinge o alvo com o peso esmagador da terra.'); }
    
    public apply(target: Entity): void {
        target.takeDamage({
            totalDamage: this.source.attributes.intelligence * 1.5,
            damageType: 'ground',
            isCritical: false,
            direction: new Vector2D(0, 0),
            attacker: this.source
        });
    }
}