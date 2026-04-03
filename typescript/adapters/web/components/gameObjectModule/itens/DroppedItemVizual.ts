import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";
import { RegisterSprite } from "../../../shared/RenderRegistry";

export type DroppedItemConstructorParams = GameObjectConstructorParams;

const staff: SpriteConfig = { imageSrc: new URL('../../../assets/itens/staff-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } };
const gun: SpriteConfig = { imageSrc: new URL('../../../assets/itens/gun-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } };
const scythe: SpriteConfig = { imageSrc: new URL('../../../assets/itens/scythe-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } };
const sword: SpriteConfig = { imageSrc: new URL('../../../assets/itens/sword-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } };

@RegisterSprite('droppedItem', '1', staff)
@RegisterSprite('droppedItem', '2', gun)
@RegisterSprite('droppedItem', '3', scythe)
@RegisterSprite('droppedItem', '4', sword)
export default class DroppedItemVisual extends GameObjectElement {
  protected constructor(initialState: DroppedItemConstructorParams['initialState'], config: SpriteConfig | undefined, image: HTMLImageElement) {
    super(initialState, config, image);
  }

  public static createWithSprite({ initialState, configs, imageCache }: DroppedItemConstructorParams): DroppedItemVisual {
    const stateFallback = initialState.state || '1'; // Lê o ID visual vindo do domínio
    const { config, image } = GameObjectElement.spritesStrategy({ initialState, configs, imageCache }, stateFallback);
    return new DroppedItemVisual(initialState, config, image);
  }
}
