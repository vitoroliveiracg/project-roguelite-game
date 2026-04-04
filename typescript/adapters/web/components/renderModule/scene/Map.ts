/** @file Contém a classe `GameMap`, responsável por carregar e desenhar a imagem de fundo do mundo do jogo. */

/** @class GameMap Encapsula a lógica de carregamento assíncrono da imagem do mapa e fornece um método `draw` para o `Renderer`. */
export default class GameMap {
  private image: HTMLImageElement;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void>;

  /** @constructor @param imageSrc A URL da imagem do mapa. */
  constructor(imageSrc: string) {
    this.image = new Image();
    this.loadPromise = new Promise((resolve, reject) => {
      this.image.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      this.image.onerror = () => reject(new Error(`Failed to load map image: ${imageSrc}`));
      this.image.src = imageSrc;
    });
  }

  /** A largura da imagem do mapa, disponível apenas após o carregamento. */
  public get width(): number {
    return this.image.width;
  }

  /** A altura da imagem do mapa, disponível apenas após o carregamento. */
  public get height(): number {
    return this.image.height;
  }

  /** Permite que o código externo aguarde o carregamento completo da imagem. */
  public async waitUntilLoaded(): Promise<void> {
    return this.loadPromise;
  }

  /** Desenha a imagem do mapa no contexto do canvas. */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isLoaded) {
      ctx.drawImage(this.image, 0, 0);
    }
  }
}