/** @file Contém a classe base `GameObjectElement`, que implementa a lógica padrão de renderização de sprites animados. */
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import { logger } from "../../shared/Logger";
import type IRenderable from "../renderModule/IRenderable";

export interface SpriteConfig {
  imageSrc: string;
  frameCount: number;
  animationSpeed: number;
  frameWidth: number;
  frameHeight: number;
}

export interface GameObjectConstructorParams {
  initialState: EntityRenderableState;
  configs: Map<string, SpriteConfig>;
  imageCache: Map<string, HTMLImageElement>;
}

/**
 * @class GameObjectElement
 * Classe base para todos os objetos visuais do jogo.
 * Por padrão, ela sabe como carregar, animar e desenhar um spritesheet.
 * Classes filhas podem estendê-la para usar essa funcionalidade ou sobrescrever
 * o método `draw` para implementar um comportamento de renderização completamente diferente.
 */
export default class GameObjectElement implements IRenderable {
  public id: number;
  public coordinates: { x: number; y: number };
  public size: { width: number; height: number };
  public rotation:number

  protected image: HTMLImageElement;
  protected config: SpriteConfig | undefined; // Explicitamente SpriteConfig | undefined

  protected currentFrame: number = 0;
  protected frameCounter: number = 0;

  constructor(initialState: EntityRenderableState, initialConfig: SpriteConfig | undefined, initialImage: HTMLImageElement) {
    this.id = initialState.id;
    this.coordinates = { ...initialState.coordinates }; // Clonar para evitar mutação externa
    this.size = initialState.size;
    this.config = initialConfig;
    this.image = initialImage;
    this.rotation = 0
  }

  /**
   * Define ou troca o sprite do objeto, gerenciando o processo de carregamento.
   * @param config A nova configuração de sprite. Se for undefined, remove o sprite.
   * @param newImage A instância da imagem já carregada do cache.
   */
  protected setSprite(config: SpriteConfig | undefined, newImage: HTMLImageElement): void {
    this.config = config;
    this.image = newImage;
  }

  /**
   * Estratégia padrão para encontrar a configuração de sprite e a imagem em cache.
   * @param params Os parâmetros de construção do objeto.
   * @param fallbackState O estado a ser usado como padrão se nenhum for fornecido (ex: 'idle', 'travelling').
   * @returns A configuração de sprite e a imagem correspondente.
   */
  protected static spritesStrategy({ initialState, configs, imageCache }: GameObjectConstructorParams, fallbackState: string): { config: SpriteConfig, image: HTMLImageElement } {
    const configKey = `${initialState.entityTypeId}-${initialState.state || fallbackState}`;
    const config = configs.get(configKey);
    if (!config) throw new Error(`Configuration not found for key: ${configKey}`);
    const image = imageCache.get(config.imageSrc);
    if (!image) throw new Error(`Image not found in cache for src: ${config.imageSrc}`);
    return { config, image };
  }

  protected updateAnimation(): void {
    if (!this.config) return; // Só anima se houver config de sprite
    this.frameCounter++;
    if (this.frameCounter >= this.config.animationSpeed) {
      this.frameCounter = 0;
      this.currentFrame = (this.currentFrame + 1) % this.config.frameCount;
    }
  }

  public updateState(newState: EntityRenderableState): void {
    this.coordinates = { ...newState.coordinates }; // Clonar para evitar mutação externa
    this.size = newState.size;
    this.rotation = newState.rotation
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    // Se não for um sprite configurado, desenha um quadrado preto como fallback.
    if (!this.config) {
      logger.log('render', `Rendering fallback black box for ID: ${this.id}`);
      ctx.fillStyle = "black";
      ctx.fillRect(this.coordinates.x, this.coordinates.y, this.size.width, this.size.height);
      return;
    }
    ctx.save();


    const centerX = this.coordinates.x + this.size.width / 2;
    const centerY = this.coordinates.y + this.size.height / 2;
    
    ctx.translate(centerX, centerY);

    ctx.rotate(this.rotation)

    ctx.translate(-centerX, -centerY);
    
    this.updateAnimation();
    ctx.imageSmoothingEnabled = false;
    const sourceX = this.currentFrame * this.config.frameWidth;
    const sourceY = 0;
    
    ctx.drawImage(this.image, sourceX, sourceY, this.config.frameWidth, this.config.frameHeight, this.coordinates.x, this.coordinates.y, this.size.width, this.size.height);
    ctx.restore()
  }
}