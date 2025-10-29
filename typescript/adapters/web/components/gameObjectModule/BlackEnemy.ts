/** @file Contém a classe `BlackEnemy`, um tipo de `Enemy` que é renderizado como um quadrado preto. */
import Enemy, { type EnemyConstructorParams } from "./Enemy";

/** @class BlackEnemy Herda de `Enemy` mas o constrói sem um sprite, fazendo com que a classe base o renderize como um quadrado preto. */
export default class BlackEnemy extends Enemy {
  constructor({ initialState }: EnemyConstructorParams) {
    // Chama o construtor protegido da classe Enemy, passando 'undefined' para a configuração
    // e uma imagem vazia. Isso garante que ele seja um 'Enemy', mas que use a lógica
    // de fallback de renderização da sua classe avó (GameObjectElement).
    super(initialState, undefined, new Image());
  }
}