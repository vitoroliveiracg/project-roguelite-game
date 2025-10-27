import type { WorldState } from "../../domain-contracts";
import type Camera from "../cameraModule/Camera";
import type Canvas from "../canvasModule/Canvas";
import type IRenderable from "./IRenderable";
import type Map from "../mapModule/Map";

export default class Renderer {
  private canvas: Canvas;
  private camera: Camera;

  constructor(canvas: Canvas, camera: Camera) {
    this.canvas = canvas;
    this.camera = camera;
  }

  public clear(): void {
    this.canvas.clear();
  }

  /**
   * Desenha um único frame na tela.
   * @param map O mapa do jogo a ser desenhado.
   * @param renderables Uma lista de objetos `IRenderable` que serão desenhados.
   */
  public drawFrame(map: Map, world: WorldState, renderables: readonly IRenderable[]): void {
    const { ctx } = this.canvas;

    // --- Camada de Entidades (Foreground) ---
    // Agora, aplicamos a transformação da câmera para desenhar as entidades
    // que se movem pelo mundo (jogador, inimigos, etc.).
    ctx.save();
    this.camera.applyTransform(ctx, world);
    map.draw(ctx); // O mapa agora é desenhado dentro do mundo, sujeito à câmera.
    renderables.forEach(renderable => renderable.draw(ctx));
    ctx.restore();
  }
}