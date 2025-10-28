/** @file Contém a `RenderableFactory`, responsável por criar objetos visuais (`IRenderable`) a partir do estado do domínio. */
import { logger } from "../../shared/Logger";
import type { EntityRenderableState } from "../../domain-contracts";
import type IRenderable from "./IRenderable";
import Sprite from "./Sprite";

/** @class RenderableFactory Utiliza o padrão Factory para desacoplar o `GameAdapter` da criação de objetos visuais concretos. Ele mapeia o estado do domínio (ex: `entityTypeId`, `state`) para a instância `IRenderable` apropriada (ex: `Sprite`). */
export class RenderableFactory {
  /** @private Contém as configurações para cada tipo de sprite, mapeando uma chave (ex: 'player-idle') para os dados do asset. Em um jogo real, isso seria carregado de arquivos de configuração. */
  private spriteConfigs: Map<string, any> = new Map([
    [
      "player-idle",
      {
        imageSrc: new URL('../../assets/playerWaiting.png', import.meta.url).href,
        frameCount: 12,
        animationSpeed: 10, // frames to wait before advancing animation
        frameWidth: 32,
        frameHeight: 32,
      },
    ],
    [
      "player-walking",
      {
        // Usando a mesma imagem por enquanto, mas idealmente seria um spritesheet de caminhada.
        imageSrc: new URL('../../assets/playerWalking.png', import.meta.url).href,
        frameCount: 12,
        animationSpeed: 5, // Animação mais rápida ao andar
        frameWidth: 32,
        frameHeight: 32,
      },
    ],
  ]);

  /** Fase de Update (Sincronização): Cria uma nova instância de um objeto `IRenderable` com base no DTO de estado fornecido pelo domínio. @param state O DTO de estado da entidade a ser criada. @returns Uma instância de `IRenderable` (ex: `Sprite`) ou `null` se nenhuma configuração for encontrada. */
  public create(state: EntityRenderableState): IRenderable | null {
    const configKey = `${state.entityTypeId}-${state.state}`;

    if (this.spriteConfigs.has(configKey)) {
      const config = this.spriteConfigs.get(configKey);
      logger.log('factory', `Creating new Sprite for entity ID: ${state.id}`, { state, config });
      return new Sprite(state, config);
    }

    logger.log('error', `No renderable configuration found for key: ${configKey}`);
    return null;
  }
}