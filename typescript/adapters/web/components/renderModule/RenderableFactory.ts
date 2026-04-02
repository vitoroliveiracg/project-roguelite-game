/** @file Contém a `RenderableFactory`, responsável por criar objetos visuais (`IRenderable`) a partir do estado do domínio. */
import { logger } from "../../shared/Logger";
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import type IRenderable from "../renderModule/IRenderable";
import { RenderRegistry } from "../../shared/RenderRegistry";

/** @class RenderableFactory Utiliza o padrão Factory para desacoplar o `GameAdapter` da criação de objetos visuais concretos. Ele mapeia o estado do domínio (ex: `entityTypeId`, `state`) para a instância `IRenderable` apropriada (ex: `Sprite`). */
export class RenderableFactory {

  //? Cache das imagens
  private imageCache: Map<string, HTMLImageElement> = new Map();

  private creationStrategies = RenderRegistry.strategies;
  private spriteConfigs = RenderRegistry.spriteConfigs;

  /** Fase de Update (Sincronização): Cria uma nova instância de um objeto `IRenderable` com base no DTO de estado fornecido pelo domínio. @param state O DTO de estado da entidade a ser criada. @returns Uma instância de `IRenderable` (ex: `Sprite`) ou `null` se nenhuma configuração for encontrada. */
  public create(state: EntityRenderableState): IRenderable | null {
    const creationStrategy = this.creationStrategies.get(state.entityTypeId);

    if (!creationStrategy) {
      logger.log('error', `(Rendable Factory) No renderable class found for entityTypeId: ${state.entityTypeId}`);
      return null;
    }

    try {
      
      return creationStrategy({
        initialState: state,
        configs: this.spriteConfigs,
        imageCache: this.imageCache 
      });
    } 
    catch (error) {
      logger.log('error', `(Rendable Factory) Failed to create renderable for ${state.entityTypeId}:`, error);
      return null;
    }
  }

  /** Pré-carrega todas as imagens definidas em `spriteConfigs` e as armazena no cache. */
  public async preloadAssets(): Promise<void> {
    const promises: Promise<void>[] = [];
    const uniqueImageSources = new Set(Array.from(this.spriteConfigs.values()).map(config => config.imageSrc));

    for (const src of uniqueImageSources) {
      if (!src) continue; // Ignora o carregamento caso uma Config possua uma url vazia (ex: CircleForm)
      if (this.imageCache.has(src)) continue;

      const promise = new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          this.imageCache.set(src, image);
          resolve();
        };
        image.onerror = () => reject(new Error(`(Rendable Factory) Failed to preload asset: ${src}`));
        image.src = src;
      });
      promises.push(promise);
    }
    await Promise.all(promises);
  }
  
}