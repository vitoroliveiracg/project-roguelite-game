import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";
import { RegisterSprite } from "../../../shared/RenderRegistry"; 

export type ProjectileConstructorParams = GameObjectConstructorParams;

const simpleBulletConfig: SpriteConfig = { imageSrc: new URL('../../../assets/entities/simple-bullet.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 16, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 16, height: 16 } };
const scytheProjectileConfig: SpriteConfig = { imageSrc: new URL('../../../assets/entities/simple-bullet.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } };
const firebalProjectile :SpriteConfig = { imageSrc: new URL('../../../assets/entities/firebola.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 }  }

@RegisterSprite('simpleBullet', 'travelling', simpleBulletConfig)
@RegisterSprite('magicMissile', 'travelling', simpleBulletConfig)
@RegisterSprite('scytheProjectile', 'travelling', scytheProjectileConfig)
@RegisterSprite('fireball', 'travelling', firebalProjectile)
export default class ProjectileVisual extends GameObjectElement {
  protected constructor(initialState: ProjectileConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    super(initialState, config, image);
  }

  public static createWithSprite({ initialState, configs, imageCache }: ProjectileConstructorParams): ProjectileVisual {
    const { config, image } = GameObjectElement.spritesStrategy({ initialState, configs, imageCache }, 'travelling');
    return new ProjectileVisual(initialState, config, image);
  }
}