/** @file Contém a classe `Player`, a representação visual do jogador. */
import type { EntityRenderableState } from "../../../../../domain/ports/domain-contracts"; 
import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";

/**
 * @class Player
 * Estende `GameObjectElement` e adiciona a lógica para gerenciar múltiplos
 * estados de animação (ex: 'idle', 'walking'), trocando a configuração do sprite
 * conforme o estado do domínio muda.
 */
export default class Player extends GameObjectElement {
  // Mapeia estados do domínio para configurações de sprite
  private readonly allConfigs: Map<string, SpriteConfig>;
  private readonly imageCache: Map<string, HTMLImageElement>;

  constructor({ initialState, configs, imageCache }: GameObjectConstructorParams) {
    // Constrói a chave correta para encontrar a configuração inicial (ex: 'player-idle')
    const initialConfigKey = `${initialState.entityTypeId}-${initialState.state || 'idle'}`;
    const initialConfig = configs.get(initialConfigKey);
    if (!initialConfig) {
      throw new Error(`Initial configuration not found for Player with key: ${initialConfigKey}`);
    }
    const initialImage = imageCache.get(initialConfig.imageSrc);
    if (!initialImage) throw new Error(`Image not found in cache for src: ${initialConfig.imageSrc}`);

    super(initialState, initialConfig, initialImage);
    this.allConfigs = configs;
    this.imageCache = imageCache;
  }

  /** Sobrescreve `updateState` para adicionar a lógica de troca de animação. */
  public override updateState(newState: EntityRenderableState): void {
    super.updateState(newState); // Chama o update do pai para atualizar coordenadas e tamanho.

    // Constrói a chave correta para encontrar a nova configuração
    const newConfigKey = `${newState.entityTypeId}-${newState.state || 'idle'}`;
    const newConfig = this.allConfigs.get(newConfigKey);
    if (newConfig && newConfig !== this.config) {
      const newImage = this.imageCache.get(newConfig.imageSrc);
      if (!newImage) throw new Error(`Image not found in cache for src: ${newConfig.imageSrc}`);

      // Troca o sprite usando a imagem já carregada do cache. A troca é instantânea.
      this.setSprite(newConfig, newImage);
      this.currentFrame = 0; // Reseta a animação
      this.frameCounter = 0;
    }
  }
}