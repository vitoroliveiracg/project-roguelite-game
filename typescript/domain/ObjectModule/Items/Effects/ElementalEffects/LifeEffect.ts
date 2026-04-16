import Effect from "../Effect";
import type Entity from "../../../Entities/Entity";

export default class LifeEffect extends Effect {
    constructor(private source: Entity) { super('Life', 'Sana as feridas através da mana.'); }
    public apply(target: Entity): void {
        target.attributes.hp += this.source.attributes.intelligence * 2;
    }
}