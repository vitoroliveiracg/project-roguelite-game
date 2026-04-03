import Effect from "./Effect";
import type Entity from "../../Entities/Entity";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type Attack from "../Attack";

export default class AreaDamageEffect extends Effect {
    constructor(
        private eventManager: IEventManager,
        private radius: number,
        private originalAttack: Attack
    ) {
        super('Area Damage', `Causa dano em área num raio de ${radius}px.`);
    }

    public apply(target: Entity): void {
        this.eventManager.dispatch('requestNeighbors', {
            requester: target,
            radius: this.radius,
            callback: (neighbors) => {
                neighbors.forEach(neighbor => {
                    if (neighbor !== target && 'takeDamage' in neighbor && neighbor.id !== this.originalAttack.attacker.id) {
                        const splashDamage = Math.floor(this.originalAttack.attacker.attributes.splashDamage || 5);
                        (neighbor as Entity).takeDamage({ totalDamage: splashDamage, damageType: 'magical', isCritical: false, direction: { x: 0, y: 0 } as any, attacker: this.originalAttack.attacker });
                    }
                });
            }
        });
    }
}