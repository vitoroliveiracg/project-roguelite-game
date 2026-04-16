import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import DecayStatus from "../../../Entities/Status/DecayStatus";

export default class DecayEffect extends Effect {
    constructor(private source: Entity) { super('Decay', 'Inicia o processo de putrefação irreversível.'); }
    public apply(target: Entity): void { target.applyStatus(new DecayStatus(8, this.source)); }
}