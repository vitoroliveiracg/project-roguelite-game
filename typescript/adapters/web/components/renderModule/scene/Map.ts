/** @file Contém a classe `GameMap`, responsável por desenhar e gerenciar chunks de mapas sob demanda. */
import { VisualConfigMap, type MapChunkVisualConfig } from "../../../shared/VisualConfigMap";

export default class GameMap {
  private chunks: string[][];
  private chunkSize: number;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadingChunks: Set<string> = new Set();

  constructor(chunks: string[][], chunkSize: number) {
    this.chunks = chunks;
    this.chunkSize = chunkSize;
  }

  /** Desenha os 9 chunks (3x3) ao redor do alvo da câmera de forma dinâmica. */
  public draw(ctx: CanvasRenderingContext2D, targetX: number, targetY: number): void {
    const currentChunkX = Math.floor(targetX / this.chunkSize);
    const currentChunkY = Math.floor(targetY / this.chunkSize);

    for (let y = currentChunkY - 1; y <= currentChunkY + 1; y++) {
      for (let x = currentChunkX - 1; x <= currentChunkX + 1; x++) {
        if (y >= 0 && y < this.chunks.length && x >= 0 && x < this.chunks[y]!.length) {
          const chunkId = this.chunks[y]![x]!;
          this.drawChunk(ctx, chunkId, x, y);
        }
      }
    }
  }

  private drawChunk(ctx: CanvasRenderingContext2D, chunkId: string, gridX: number, gridY: number): void {
    if (this.imageCache.has(chunkId)) {
      ctx.drawImage(this.imageCache.get(chunkId)!, gridX * this.chunkSize, gridY * this.chunkSize, this.chunkSize, this.chunkSize);
    } else if (!this.loadingChunks.has(chunkId)) {
      this.loadingChunks.add(chunkId);
      const config = VisualConfigMap[chunkId] as MapChunkVisualConfig;
      if (config && config.imageSrc) {
        const img = new Image();
        img.onload = () => { this.imageCache.set(chunkId, img); this.loadingChunks.delete(chunkId); };
        img.onerror = () => { console.error(`Falha ao carregar o chunk: ${config.imageSrc}`); this.loadingChunks.delete(chunkId); };
        img.src = config.imageSrc;
      }
    }
  }
}