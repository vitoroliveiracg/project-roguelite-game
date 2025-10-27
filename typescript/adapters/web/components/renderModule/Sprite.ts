import type { EntityRenderableState } from "../../domain-contracts";
import type IRenderable from "./IRenderable";

interface SpriteConfig {
  imageSrc: string;
  frameCount: number;
  animationSpeed: number; // frames to wait before advancing animation
  frameWidth: number;
  frameHeight: number;
}

/**
 * Um objeto renderizável que representa um sprite animado a partir de um spritesheet.
 * Encapsula a lógica de carregar a imagem, gerenciar a animação e desenhar o frame correto.
 */
export default class Sprite implements IRenderable {
  public id: number;

  // Estado da entidade (do domínio)
  public coordinates: { x: number; y: number };
  public size: { width: number; height: number };

  // Propriedades do Sprite
  private image: HTMLImageElement;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void>;
  private config: SpriteConfig;

  // Animação
  private currentFrame: number = 0;
  private frameCounter: number = 0;

  constructor(initialState: EntityRenderableState, config: SpriteConfig) {
    this.id = initialState.id;
    this.coordinates = initialState.coordinates;
    this.size = initialState.size;
    this.config = config;

    this.image = new Image();
    this.loadPromise = new Promise((resolve, reject) => {
      this.image.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      this.image.onerror = () => {
        reject(new Error(`Failed to load sprite: ${this.config.imageSrc}`));
      };
      this.image.src = this.config.imageSrc;
    });
  }

  // Allows external code to wait until the image is fully loaded.
  public async waitUntilLoaded(): Promise<void> { return this.loadPromise; }

  private updateAnimation(): void {
    this.frameCounter++;
    if (this.frameCounter >= this.config.animationSpeed) {
      this.frameCounter = 0;
      this.currentFrame = (this.currentFrame + 1) % this.config.frameCount;
    }
  }

  public updateState(newState: EntityRenderableState): void {
    // Adiciona verificações para garantir que o novo estado tenha as propriedades esperadas.
    // Isso torna o componente mais robusto contra estados de domínio incompletos ou malformados.
    if (newState.coordinates) {
      this.coordinates = newState.coordinates;
    }
    if (newState.size) {
      this.size = newState.size;
    }
    // Aqui você poderia trocar o `this.config` se o estado mudasse (ex: 'idle' -> 'walking')
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded) return;

    this.updateAnimation();

    // For crisp pixel art, it's crucial to disable image smoothing.
    // This prevents the browser from blurring the scaled-up sprite.
    ctx.imageSmoothingEnabled = false;

    const sourceX = this.currentFrame * this.config.frameWidth;
    const sourceY = 0; // Assumindo que o spritesheet é uma única linha horizontal

    ctx.drawImage(
      this.image,
      sourceX,
      sourceY,
      this.config.frameWidth,
      this.config.frameHeight,
      this.coordinates.x,
      this.coordinates.y,
      this.size.width,
      this.size.height
    );
  }
}