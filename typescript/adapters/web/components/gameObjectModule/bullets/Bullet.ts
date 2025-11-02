import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";

//? Esse type é muito importante
export type BulletConstructorParams = GameObjectConstructorParams;

export default class Bullet extends GameObjectElement {

  protected constructor(initialState: BulletConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    super(initialState, config, image);
  }

  /** Método estático de fábrica para criar inimigos com sprites. */
  public static createWithSprite({ initialState, configs, imageCache }: BulletConstructorParams): Bullet {
    const { config, image } = this.spritesStrategy({ initialState, configs, imageCache }, 'travelling');
    return new Bullet(initialState, config, image);
  }
}