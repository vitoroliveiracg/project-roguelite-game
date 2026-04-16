import type Entity from "../Entity";
import StatusEffect from "./StatusEffect";

export default class VulnerableStatus extends StatusEffect {
    constructor(duration: number) { super('vulnerable', 'Defesa esmigalhada.', duration, 0.5); }
    protected override onApply(target: Entity): void { target.attributes.defence -= 8; }
    protected override onRemove(target: Entity): void { target.attributes.defence += 8; }
}