export default class Map {
  private image: HTMLImageElement;
  private isLoaded: boolean = false;
  private loadPromise: Promise<void>;

  public get width(): number { return this.image.width; }
  public get height(): number { return this.image.height; }


  constructor(imageUrl: string) {
    this.image = new Image();
    this.loadPromise = new Promise((resolve, reject) => {
      
      this.image.onload = () => {
        this.isLoaded = true;
        console.log("Mapa carregado com sucesso!");
        resolve();
      };
      this.image.onerror = () => {
        console.error("Falha ao carregar a imagem do mapa.");
        reject(new Error(`Falha ao carregar: ${imageUrl}`));
      };
      this.image.src = imageUrl;
    
    });
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.isLoaded) {
      // Desenha o mapa no tamanho original da imagem, começando em (0,0) do mundo.
      // A câmera cuidará do zoom e do posicionamento.
      ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
    }
  }

  public waitUntilLoaded(): Promise<void> {
    return this.loadPromise;
  }
}