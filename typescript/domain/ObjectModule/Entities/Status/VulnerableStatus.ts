import type Entity from "../Entity";
import StatusEffect from "./StatusEffect";

export default class VulnerableStatus extends StatusEffect {
    constructor(duration: number) { super('vulnerable', 'Defesa esmigalhada.', duration, 0.5); }
}