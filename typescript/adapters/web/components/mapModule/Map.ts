/** @file Contém a classe Map, responsável por carregar e desenhar a imagem de fundo do mundo do jogo. */
/** @class Map Encapsula a lógica de carregamento e desenho da imagem de fundo do jogo. Atua como um asset visual que pode ser desenhado pelo Renderer. */
export default class Map {
  private image: HTMLImageElement;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void>;

  /** A largura da imagem do mapa em pixels, disponível após o carregamento. */
  public get width(): number { return this.image.width; }
  /** A altura da imagem do mapa em pixels, disponível após o carregamento. */
  public get height(): number { return this.image.height; }

  /** @constructor Inicia o processo de carregamento assíncrono da imagem do mapa. @param imageUrl A URL da imagem do mapa a ser carregada. */
  constructor(imageUrl: string) {
    this.image = new Image();
    this.loadPromise = new Promise((resolve, reject) => {
      this.image.onload = () => {
        this.isLoaded = true;
        resolve();
      };
      this.image.onerror = () => reject(new Error(`Falha ao carregar o mapa: ${imageUrl}`));
      this.image.src = imageUrl;
    });
  }

  /** Fase de Desenho: Desenha a imagem do mapa no canvas na posição (0,0) do mundo. A câmera é responsável por posicionar e escalar corretamente a viewport sobre o mapa. @param ctx O contexto de renderização 2D do canvas. */
  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isLoaded) ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
  }

  /** Fase de Inicialização: Permite que o código externo (como o `GameAdapter`) aguarde o carregamento completo da imagem do mapa antes de prosseguir. @returns Uma promessa que resolve quando a imagem é carregada. */
  public waitUntilLoaded(): Promise<void> {
    return this.loadPromise;
  }
}