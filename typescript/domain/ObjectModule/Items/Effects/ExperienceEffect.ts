import Effect from "./Effect";
import type Entity from "../../Entities/Entity";
import type Player from "../../Entities/Player/Player";

export default class ExperienceEffect extends Effect {
    constructor(private amount: number) {
        super('Experience Gain', `Concede conhecimento arcano, garantindo ${amount} pontos de experiência.`);
    }

    public apply(target: Entity): void {
        // Subida de nível direta através de itens (Ex: Tomos Antigos)
        if ('gainXp' in target) (target as Player).gainXp(this.amount);
    }
}