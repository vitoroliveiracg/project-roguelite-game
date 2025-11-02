/** @file Contém a classe `Enemy`, a representação visual de um inimigo no jogo. */
import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";

//? Esse type é muito importante
export type EnemyConstructorParams = GameObjectConstructorParams;

/** @class Enemy Herda de `GameObjectElement` e usa sua funcionalidade padrão de sprite. */
export default class Enemy extends GameObjectElement {

  protected constructor(initialState: EnemyConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    super(initialState, config, image);
  }

  /** Método estático de fábrica para criar inimigos com sprites. */
  public static createWithSprite({ initialState, configs, imageCache }: EnemyConstructorParams): Enemy {
    const { config, image } = this.spritesStrategy({ initialState, configs, imageCache }, 'idle');
    return new Enemy(initialState, config, image);
  }
}