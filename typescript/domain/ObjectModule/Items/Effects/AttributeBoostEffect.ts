import Effect from "./Effect";
import type Entity from "../../Entities/Entity";
import type { baseAttributes } from "../../Entities/Attributes";

export default class AttributeBoostEffect extends Effect {
    constructor(private attribute: keyof baseAttributes, private amount: number) {
        super('Attribute Boost', `Aumenta permanentemente o atributo ${attribute} em ${amount}.`);
    }

    public apply(target: Entity): void {
        if (this.attribute in target.attributes) {
            // Um elixir de Força ou Destreza modifica a base do personagem para a run toda!
            (target.attributes as any)[this.attribute] += this.amount;
        }
    }
}