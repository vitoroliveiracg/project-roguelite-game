/** @file Contém a classe `GameMap`, responsável por desenhar e gerenciar chunks de mapas sob demanda. */
import { VisualConfigMap, type MapVisualConfig } from "../../../shared/VisualConfigMap";

export default class GameMap {
  private config: MapVisualConfig;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadingChunks: Set<string> = new Set();

  constructor(mapId: string) {
    const config = VisualConfigMap[mapId];
    if (!config || config.category !== 'map') {
        throw new Error(`Configuração visual não encontrada para o mapa: ${mapId}`);
    }
    this.config = config as MapVisualConfig;
  }

  /** Desenha os 9 chunks (3x3) ao redor do alvo da câmera de forma dinâmica. */
  public draw(ctx: CanvasRenderingContext2D, targetX: number, targetY: number): void {
    const currentChunkX = Math.floor(targetX / this.config.chunkSize);
    const currentChunkY = Math.floor(targetY / this.config.chunkSize);

    for (let y = currentChunkY - 1; y <= currentChunkY + 1; y++) {
      for (let x = currentChunkX - 1; x <= currentChunkX + 1; x++) {
        if (y >= 0 && y < this.config.chunks.length && x >= 0 && x < this.config.chunks[y]!.length) {
          const imageUrl = this.config.chunks[y]![x]!;
          this.drawChunk(ctx, imageUrl, x, y);
        }
      }
    }
  }

  private drawChunk(ctx: CanvasRenderingContext2D, imageUrl: string, gridX: number, gridY: number): void {
    if (this.imageCache.has(imageUrl)) {
      ctx.drawImage(this.imageCache.get(imageUrl)!, gridX * this.config.chunkSize, gridY * this.config.chunkSize, this.config.chunkSize, this.config.chunkSize);
    } else if (!this.loadingChunks.has(imageUrl)) {
      this.loadingChunks.add(imageUrl);
      if (imageUrl) {
        const img = new Image();
        img.onload = () => { this.imageCache.set(imageUrl, img); this.loadingChunks.delete(imageUrl); };
        img.onerror = () => { console.error(`Falha ao carregar a textura do mapa: ${imageUrl}`); this.loadingChunks.delete(imageUrl); };
        img.src = imageUrl;
      }
    }
  }
}