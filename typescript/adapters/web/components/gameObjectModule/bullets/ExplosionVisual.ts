import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement" ;
import { RegisterSprite } from "../../../shared/RenderRegistry"; 

export type VisualEffectConstructorParams = GameObjectConstructorParams;

import explosionImg from '../../../assets/entities/explosion.png';

const explosionConfig: SpriteConfig = { 
  imageSrc: explosionImg, 
  frameCount: 16, animationSpeed: 1, 
  frameWidth: 32, frameHeight: 32,
  atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 128, height: 128 } 
};

@RegisterSprite('explosion', 'active', explosionConfig)
export default class ExplosionVisual extends GameObjectElement {
  protected constructor(initialState: VisualEffectConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    super(initialState, config, image);
  }

  public static createWithSprite({ initialState, configs, imageCache }: VisualEffectConstructorParams): ExplosionVisual {
    const { config, image } = GameObjectElement.spritesStrategy({ initialState, configs, imageCache }, 'active');
    return new ExplosionVisual(initialState, config, image);
  }
}