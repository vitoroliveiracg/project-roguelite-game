import type Entity from "../Entity";
import StatusEffect from "./StatusEffect";

export default class FearStatus extends StatusEffect {
    constructor(duration: number) { super('fear', 'Vetores de movimento invertidos.', duration, 0.02); } // Roda em altíssima frequência
    
    protected override onTick(target: Entity): void {
        // Inverte a intenção de movimento da IA (Se tentou vir pra cima, corre pra longe)
        target.velocity.invertMut();
        
        const cx = target.coordinates.x + target.size.width / 2; const cy = target.coordinates.y + target.size.height / 2;
        if (Math.random() < 0.1) (target as any).eventManager?.dispatch('particle', { effect: 'magicAura', x: cx, y: cy, color: '#dc143c' });
    }
}