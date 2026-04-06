import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import PoisonStatus from "../../../Entities/Status/PoisonStatus";

export default class PoisonEffect extends Effect {
    constructor(private source: Entity) { super('Nature', 'Envenena o alvo.'); }
    public apply(target: Entity): void {
        target.applyStatus(new PoisonStatus(5, this.source));
    }
}