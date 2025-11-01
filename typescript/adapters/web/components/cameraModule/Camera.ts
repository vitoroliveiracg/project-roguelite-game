/** @file Contém a classe Camera, responsável por gerenciar a viewport do jogo (zoom, posicionamento e seguir um alvo). */
import type { WorldState } from "../../../../domain/ports/domain-contracts";
import type Canvas from "../canvasModule/Canvas";
import type IRenderable from "../renderModule/IRenderable";

/** @class Camera Gerencia a viewport do jogo. Seu papel é calcular a translação e o zoom necessários para seguir um objeto alvo (`IRenderable`) e garantir que a visão não ultrapasse os limites do mundo. */
export default class Camera {
  private canvas: Canvas;
  private target: IRenderable | null = null;
  public zoom: number;
  private camX:number = 0;
  private camY:number = 0;

  /** @constructor @param canvas A instância do `Canvas` cujas dimensões definem a viewport. @param zoom O nível de magnificação inicial da câmera. */
  constructor(canvas: Canvas, zoom: number = 1) {
    this.canvas = canvas;
    this.zoom = zoom;
  }

  /** Fase de Update: Define o objeto `IRenderable` que a câmera deve seguir. Geralmente chamado a cada frame para rastrear o jogador. @param target O objeto a ser seguido. */
  public setTarget(target: IRenderable): void {
    this.target = target;
  }

  /** Fase de Desenho: Calcula e aplica as transformações de translação e escala ao contexto do canvas para centralizar o alvo e aplicar o zoom, restringindo a visão aos limites do mundo. @param ctx O contexto de renderização 2D onde a transformação será aplicada. @param world O estado do mundo, usado para obter os limites para o clamping da câmera. */
  public applyTransform(ctx: CanvasRenderingContext2D, world: WorldState): void {
    if (!this.target) return;

    const viewWidth = this.canvas.element.width / this.zoom;
    const viewHeight = this.canvas.element.height / this.zoom;

    let camX = (this.target.coordinates.x + this.target.size.width / 2) - viewWidth / 2; // Calcula a posição X da câmera para centralizar o alvo.
    let camY = (this.target.coordinates.y + this.target.size.height / 2) - viewHeight / 2; // Calcula a posição Y da câmera para centralizar o alvo.

    camX = Math.max(0, Math.min(camX, world.width - viewWidth)); // Restringe a câmera para não mostrar áreas fora do mundo (eixo X).
    camY = Math.max(0, Math.min(camY, world.height - viewHeight)); // Restringe a câmera para não mostrar áreas fora do mundo (eixo Y).

    this.camX = camX
    this.camY = camY

    ctx.scale(this.zoom, this.zoom); // Aplica o fator de zoom ao contexto.
    ctx.translate(-camX, -camY); // Aplica a translação para posicionar o mundo de acordo com a câmera.
  }
}