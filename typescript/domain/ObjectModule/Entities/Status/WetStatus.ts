import type Entity from "../Entity";
import StatusEffect from "./StatusEffect";

export default class WetStatus extends StatusEffect {
    constructor(duration: number) { super('wet', 'Vulnerable to Thunder. Resistant to Fire.', duration, 0.5); } // Tick muito rápido apenas para efeito visual
    
    protected override onTick(target: Entity): void {
        const cx = target.coordinates.x + target.size.width / 2; const cy = target.coordinates.y + target.size.height / 2;
        (target as any).eventManager?.dispatch('particle', { effect: 'magicAura', x: cx, y: cy, color: '#00BFFF' }); // Gotículas contínuas
    }
}