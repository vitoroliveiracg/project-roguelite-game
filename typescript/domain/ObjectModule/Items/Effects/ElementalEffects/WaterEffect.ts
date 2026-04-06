import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import WetStatus from "../../../Entities/Status/WetStatus";

export default class WaterEffect extends Effect {
    constructor() { super('Water', 'Deixa o alvo molhado.'); }
    public apply(target: Entity): void {
        target.applyStatus(new WetStatus(6)); // 6 Segundos de condutividade
    }
}