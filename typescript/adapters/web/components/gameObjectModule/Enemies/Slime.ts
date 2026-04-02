/** @file Contém a classe `Slime`, um tipo de `Enemy` que é renderizado como um quadrado preto. */

import Enemy, { type EnemyConstructorParams } from "./Enemy";
import type { SpriteConfig } from "../GameObjectElement";
import { RegisterSprite } from "../../../shared/RenderRegistry";

const slimeConfig: SpriteConfig = {
  imageSrc: new URL('../../../assets/entities/slime-green-walk.png', import.meta.url).href,
  frameCount: 8, animationSpeed: 10, frameWidth: 32, frameHeight: 32,
  atlasOffset: { x: 64, y: 0 }, spriteSize: { width: 32, height: 32 }
};

/** @class Slime Herda de `Enemy` mas o constrói sem um sprite, fazendo com que a classe base o renderize como um quadrado preto. */
@RegisterSprite('slime', 'walking', slimeConfig)
@RegisterSprite('slime', 'waiting', slimeConfig)
export default class Slime extends Enemy {
  constructor(initialState: EnemyConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    // Chama o construtor protegido da classe Enemy, passando 'undefined' para a configuração
    // e uma imagem vazia. Isso garante que ele seja um 'Enemy', mas que use a lógica
    // de fallback de renderização da sua classe avó (GameObjectElement).
    super(initialState, config, image);

  }

  public static override createWithSprite({ initialState, configs, imageCache }: EnemyConstructorParams): Slime {
    const {config, image} = Enemy.spritesStrategy({ initialState, configs, imageCache }, "walking")
    return new Slime(initialState, config, image );
  }
}