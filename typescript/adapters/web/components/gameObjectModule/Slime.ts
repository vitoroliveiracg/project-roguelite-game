/** @file Contém a classe `Slime`, um tipo de `Enemy` que é renderizado como um quadrado preto. */

import Enemy, { type EnemyConstructorParams } from "./Enemy";
import type { SpriteConfig } from "./GameObjectElement";

/** @class Slime Herda de `Enemy` mas o constrói sem um sprite, fazendo com que a classe base o renderize como um quadrado preto. */
export default class Slime extends Enemy {
  constructor(initialState: EnemyConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    // Chama o construtor protegido da classe Enemy, passando 'undefined' para a configuração
    // e uma imagem vazia. Isso garante que ele seja um 'Enemy', mas que use a lógica
    // de fallback de renderização da sua classe avó (GameObjectElement).
    super(initialState, config, image);

  }

  public static override createWithSprite({ initialState, configs, imageCache }: EnemyConstructorParams): Slime {
    const {config, image} = Enemy.spritesStrategy({ initialState, configs, imageCache })
    return new Slime(initialState, config, image );
  }
}