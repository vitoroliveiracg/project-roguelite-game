import Effect from "./Effect";
import type Entity from "../../Entities/Entity";
import type Player from "../../Entities/Player/Player";

export default class AddCoinsEffect extends Effect {
    constructor(private amount: number) {
        super('Add Coins', `Adiciona ${amount} moedas de ouro.`);
    }

    public apply(target: Entity): void {
        // Apenas o jogador possui uma carteira no momento
        if ('coins' in target) (target as Player).coins += this.amount;
    }
}