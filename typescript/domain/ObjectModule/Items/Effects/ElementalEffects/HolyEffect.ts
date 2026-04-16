import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import type Attack from "../../Attack";
import Vector2D from "../../../../shared/Vector2D";

export default class HolyEffect extends Effect {
    constructor(private source: Entity, private attack: Attack) { super('Holy', 'Dano x2 fixo contra entidades das Trevas.'); }
    public apply(target: Entity): void {
        if (target.elementalType === 'dark') {
            const baseDmg = (this.attack as any).baseDamage || 10;
            target.takeDamage({ totalDamage: baseDmg, damageType: 'light', isCritical: false, direction: new Vector2D(0,0), attacker: this.source });
        }
    }
}