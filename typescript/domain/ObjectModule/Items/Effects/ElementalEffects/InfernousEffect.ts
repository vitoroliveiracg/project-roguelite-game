import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";
import BlindStatus from "../../../Entities/Status/BlindStatus";

export default class InfernousEffect extends Effect {
    constructor() { super('Infernous', 'Luz que arranca a visão.'); }
    public apply(target: Entity): void { target.applyStatus(new BlindStatus(5)); }
}