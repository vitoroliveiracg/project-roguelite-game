import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import SlowStatus from "../../../Entities/Status/SlowStatus";

export default class AirEffect extends Effect {
    constructor() { super('Air', 'Ventos que afundam a movimentação.'); }
    public apply(target: Entity): void { target.applyStatus(new SlowStatus(4)); }
}