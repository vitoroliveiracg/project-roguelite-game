import type Entity from "../Entity";
import StatusEffect from "./StatusEffect";

export default class BlindStatus extends StatusEffect {
    constructor(duration: number) { super('blind', 'Cegueira.', duration, 0.5); }
    protected override onApply(target: Entity): void { target.attributes.accuracy -= 50; }
    protected override onRemove(target: Entity): void { target.attributes.accuracy += 50; }
}