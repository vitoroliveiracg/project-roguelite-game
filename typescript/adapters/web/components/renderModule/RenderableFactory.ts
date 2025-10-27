import type { EntityRenderableState } from "../../domain-contracts";
import type IRenderable from "./IRenderable";
import Sprite from "./Sprite";

/**
 * A factory for creating IRenderable objects.
 * It maps domain state (entityTypeId, state) to concrete presentation objects (like Sprites).
 * This decouples the GameAdapter from the details of how renderables are created.
 */
export class RenderableFactory {
  // In a real game, you would load these configs from a file
  private spriteConfigs: Map<string, any> = new Map([
    [
      "player-idle",
      {
        imageSrc: new URL('../../assets/playerWaiting.png', import.meta.url).href,
        // Corrigido: O spritesheet tem 12 frames.
        frameCount: 12,
        animationSpeed: 10, // frames to wait before advancing animation
        frameWidth: 32,
        frameHeight: 32,
      },
    ],
  ]);

  public create(state: EntityRenderableState): IRenderable | null {
    const configKey = `${state.entityTypeId}-${state.state}`;

    if (this.spriteConfigs.has(configKey)) {
      const config = this.spriteConfigs.get(configKey);
      return new Sprite(state, config);
    }

    console.warn(`No renderable configuration found for key: ${configKey}`);
    return null;
  }
}