import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";
import { RegisterSprite } from "../../../shared/RenderRegistry";

//? Esse type é muito importante
export type BulletConstructorParams = GameObjectConstructorParams;

const simpleBulletConfig: SpriteConfig = { imageSrc: new URL('../../../assets/entities/simple-bullet.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 16, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 16, height: 16 } };
const scytheProjectileConfig: SpriteConfig = { imageSrc: new URL('../../../assets/itens/scythe-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } };

@RegisterSprite('simpleBullet', 'travelling', simpleBulletConfig)
@RegisterSprite('magicMissile', 'travelling', simpleBulletConfig)
@RegisterSprite('scytheProjectile', 'travelling', scytheProjectileConfig)
@RegisterSprite('fireball', 'travelling', simpleBulletConfig)
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