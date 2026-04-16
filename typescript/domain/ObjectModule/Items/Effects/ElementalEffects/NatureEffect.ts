import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import VulnerableStatus from "../../../Entities/Status/VulnerableStatus";
import StunStatus from "../../../Entities/Status/StunStatus";

export default class NatureEffect extends Effect {
    constructor() { super('Nature', 'Corrói a armadura natural.'); }
    public apply(target: Entity): void {
        target.applyStatus(new VulnerableStatus(5));
        if (Math.random() < 0.25) target.applyStatus(new StunStatus(1));
    }
}