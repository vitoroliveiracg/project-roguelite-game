/** @file Contém a classe `Enemy`, a representação visual de um inimigo no jogo. */
import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "./GameObjectElement";

//? Esse type é muito importante
export type EnemyConstructorParams = GameObjectConstructorParams;

/** @class Enemy Herda de `GameObjectElement` e usa sua funcionalidade padrão de sprite. */
export default class Enemy extends GameObjectElement {
  /**
   * O construtor é protegido para permitir que subclasses (como BlackEnemy) o chamem
   * com parâmetros diferentes, enquanto a criação normal ainda é feita via factory.
   */
  protected constructor(initialState: EnemyConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    super(initialState, config, image);
  }

  /** Método estático de fábrica para criar inimigos com sprites. */
  public static createWithSprite({ initialState, configs, imageCache }: EnemyConstructorParams): Enemy {
    const {config, image} = Enemy.spritesStrategy({ initialState, configs, imageCache })
    return new Enemy(initialState, config, image);
  }

  //! deveria estar em Entity
  public static spritesStrategy({ initialState, configs, imageCache }: EnemyConstructorParams): {config:SpriteConfig|undefined, image:HTMLImageElement}{
    const configKey = `${initialState.entityTypeId}-${initialState.state || 'idle'}`;
    const config = configs.get(configKey);
    if (!config) throw new Error(`Configuration not found for Enemy with key: ${configKey}`);
    const image = imageCache.get(config.imageSrc);
    if (!image) throw new Error(`Image not found in cache for src: ${config.imageSrc}`);
    return {config, image}
  }
}