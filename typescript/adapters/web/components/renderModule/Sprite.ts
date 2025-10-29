/** @file Contém a classe `Sprite`, uma implementação de `IRenderable` que gerencia spritesheets animados. */
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import type IRenderable from "./IRenderable";

interface SpriteConfig {
  imageSrc: string;
  frameCount: number;
  animationSpeed: number; // frames to wait before advancing animation
  frameWidth: number;
  frameHeight: number;
}

/** @class Sprite Uma implementação de `IRenderable` que representa um sprite animado. Encapsula a lógica de carregar a imagem do spritesheet, gerenciar o estado da animação e desenhar o frame correto na tela. */
export default class Sprite implements IRenderable {
  public id: number;

  public coordinates: { x: number; y: number };
  public size: { width: number; height: number };

  private image: HTMLImageElement;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void>;
  private config: SpriteConfig;

  private currentFrame: number = 0;
  private frameCounter: number = 0;

  /** @constructor @param initialState O DTO de estado inicial vindo do domínio. @param config O objeto de configuração contendo os dados do spritesheet (URL, contagem de frames, etc.). */
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

  /** Fase de Inicialização: Permite que o código externo (como o `GameAdapter`) aguarde o carregamento completo da imagem do sprite antes de iniciar o jogo. @returns Uma promessa que resolve quando a imagem é carregada. */
  public async waitUntilLoaded(): Promise<void> { return this.loadPromise; }

  /** Fase de Desenho (Lógica Interna): Avança o frame da animação com base na velocidade configurada (`animationSpeed`). Chamado internamente por `draw`. @private */
  private updateAnimation(): void {
    this.frameCounter++;
    if (this.frameCounter >= this.config.animationSpeed) {
      this.frameCounter = 0;
      this.currentFrame = (this.currentFrame + 1) % this.config.frameCount;
    }
  }

  /** Fase de Update (Sincronização): Atualiza as propriedades do sprite (coordenadas, tamanho) com base no novo estado recebido do domínio. @param newState O DTO de estado mais recente. */
  public updateState(newState: EntityRenderableState): void {
    if (newState.coordinates) {
      this.coordinates = newState.coordinates;
    }
    if (newState.size) {
      this.size = newState.size;
    }
  }

  /** Fase de Desenho: Atualiza a animação e desenha o frame atual do spritesheet na posição correta no canvas. @param ctx O contexto de renderização 2D do canvas. */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isLoaded) return;

    this.updateAnimation();

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