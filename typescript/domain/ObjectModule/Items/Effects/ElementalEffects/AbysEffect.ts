import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import FearStatus from "../../../Entities/Status/FearStatus";

export default class AbysEffect extends Effect {
    constructor() { super('Abys', 'Inverte os vetores de movimento por medo.'); }
    public apply(target: Entity): void { target.applyStatus(new FearStatus(3)); }
}