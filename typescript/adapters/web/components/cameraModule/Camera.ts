import type { WorldState } from "../../domain-contracts";
import type Canvas from "../canvasModule/Canvas";
import type IRenderable from "../renderModule/IRenderable";

export default class Camera {
  private canvas: Canvas;
  private target: IRenderable | null = null;
  private zoom: number;

  constructor(canvas: Canvas, zoom: number = 1) {
    this.canvas = canvas;
    this.zoom = zoom;
  }

  public setTarget(target: IRenderable): void {
    this.target = target;
  }

  /**
   * Aplica as transformações de zoom e translação ao contexto do canvas.
   * 1. Move o ponto de origem do canvas para o centro da tela.
   * 2. Aplica o zoom a partir deste novo centro.
   * 3. Move o mundo (translação negativa) para que o alvo fique no centro da visão da câmera.
   * A câmera é "presa" (clamped) para não mostrar áreas fora do mundo.
   * @param ctx O contexto de renderização 2D do canvas.
   */
  public applyTransform(ctx: CanvasRenderingContext2D, world: WorldState): void {
    if (!this.target) return;

    // A largura e altura visível do mundo através da câmera, considerando o zoom.
    const viewWidth = this.canvas.element.width / this.zoom;
    const viewHeight = this.canvas.element.height / this.zoom;

    // Calcula a posição ideal da câmera (canto superior esquerdo da "janela" da câmera)
    // para centralizar o alvo.
    const targetCenter = {
      x: this.target.coordinates.x + this.target.size.width / 2,
      y: this.target.coordinates.y + this.target.size.height / 2,
    };
    let camX = targetCenter.x - viewWidth / 2;
    let camY = targetCenter.y - viewHeight / 2;

    // Garante que a câmera não ultrapasse os limites do mundo.
    const minCamX = 0;
    const maxCamX = world.width - viewWidth;
    const minCamY = 0;
    const maxCamY = world.height - viewHeight;

    camX = Math.max(minCamX, Math.min(camX, maxCamX));
    camY = Math.max(minCamY, Math.min(camY, maxCamY));

    // Aplica as transformações:
    // 1. Aplica o zoom.
    ctx.scale(this.zoom, this.zoom);
    // 2. Aplica a translação (move o mundo).
    ctx.translate(-camX, -camY);
  }
}