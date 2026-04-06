import Consumable from "./Consumable";
import AddCoinsEffect from "../Effects/AddCoinsEffect";

export default class Coin extends Consumable {
    constructor(amount: number = 10) {
        // A moeda é auto-consumível pela regra de negócio e soma direto na carteira do Player!
        super('Moedas de Ouro', 'Pedaços de ouro puro. São pesados, brilhantes e a linguagem universal.', 33, 'common', 'currency', 33, amount, [new AddCoinsEffect(amount)]);
    }
}