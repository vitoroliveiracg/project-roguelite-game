/** @file Contém a `RenderableFactory`, responsável por criar objetos visuais (`IRenderable`) a partir do estado do domínio. */
import { logger } from "../../shared/Logger";
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import Enemy, { type EnemyConstructorParams } from "../gameObjectModule/Enemy";
import BlackEnemy from "../gameObjectModule/BlackEnemy";
import Player from "../gameObjectModule/playerModule/Player";
import type IRenderable from "../renderModule/IRenderable";
import type { SpriteConfig } from "../gameObjectModule/GameObjectElement";
import type GameObjectElement from "../gameObjectModule/GameObjectElement";
import Bullet from "../gameObjectModule/bullets/bullet";
import CircleForm from "../gameObjectModule/geometryForms/CircleForm";

/** @class RenderableFactory Utiliza o padrão Factory para desacoplar o `GameAdapter` da criação de objetos visuais concretos. Ele mapeia o estado do domínio (ex: `entityTypeId`, `state`) para a instância `IRenderable` apropriada (ex: `Sprite`). */
export class RenderableFactory {

  //? Cache das imagens
  private imageCache: Map<string, HTMLImageElement> = new Map();

  // O tipo agora é mais genérico para acomodar diferentes construtores/fábricas.
  private creationStrategies: Map<string, (params: EnemyConstructorParams) => GameObjectElement> = new Map([
    ['player', (params) => new Player(params)],
    ['enimie', (params) => Enemy.createWithSprite(params)],
    ['blackEnemy', (params) => BlackEnemy.createWithSprite(params)],
    ['simpleBullet', (params)=>Bullet.createWithSprite(params)],
    ['circle', (params)=> new CircleForm(params)]
  ]);

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

  /** @private Mapeia uma chave de configuração (ex: 'player-idle') para os dados do asset. */
  private spriteConfigs: Map<string, SpriteConfig> = new Map([
    ['player-idle', { imageSrc: new URL('../../assets/entities/player/player-idle.png', import.meta.url).href, frameCount: 2, animationSpeed: 20, frameWidth: 32, frameHeight: 32, }],
    ['player-walking', { imageSrc: new URL('../../assets/entities/player/player-idle.png', import.meta.url).href, frameCount: 2, animationSpeed: 20, frameWidth: 32, frameHeight: 32, }],
    ['blackEnemy-waiting', { imageSrc: new URL('../../assets/entities/slime-green-walk.png', import.meta.url).href, frameCount: 8, animationSpeed: 10, frameWidth: 32, frameHeight: 32, }],
    ['simpleBullet-travelling', { imageSrc: new URL('../../assets/entities/simple-bullet.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 16, frameHeight: 16, }],
  ]);

  /** Pré-carrega todas as imagens definidas em `spriteConfigs` e as armazena no cache. */
  public async preloadAssets(): Promise<void> {
    const promises: Promise<void>[] = [];
    const uniqueImageSources = new Set(Array.from(this.spriteConfigs.values()).map(config => config.imageSrc));

    for (const src of uniqueImageSources) {
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