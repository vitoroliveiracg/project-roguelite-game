import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import FreezeStatus from "../../../Entities/Status/FreezeStatus";

export default class IceEffect extends Effect {
    constructor() { super('Ice', 'Congela os músculos e ossos.'); }
    public apply(target: Entity): void { target.applyStatus(new FreezeStatus(3.5)); }
}