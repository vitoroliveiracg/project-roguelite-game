import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import Vector2D from "../../../../shared/Vector2D";

export default class DarkEffect extends Effect {
    constructor(private source: Entity) { 
        super('Dark', 'Corrompe a vida do alvo ignorando defesas.'); 
    }
    
    public apply(target: Entity): void {
        target.takeDamage({
            totalDamage: this.source.attributes.intelligence * 1.2,
            damageType: 'dark',
            isCritical: false,
            direction: new Vector2D(0, 0),
            attacker: this.source
        });
    }
}