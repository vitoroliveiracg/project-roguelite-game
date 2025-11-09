/** @file Contém a classe `Renderer`, responsável por desenhar o estado do jogo no canvas a cada frame. */
import type { EntityRenderableState, WorldState } from "../../../../domain/ports/domain-contracts";
import type Camera from "../cameraModule/Camera";
import type Canvas from "../canvasModule/Canvas";
import type IRenderableObject from "./IRenderable";
import type IRenderer from "./IRenderer";
import type GameMap from "../mapModule/Map";

/** @class Renderer Orquestra o processo de desenho no canvas 2D. Ele interage com a `Câmera` para aplicar transformações de viewport e itera sobre os objetos `IRenderable` para desenhar um frame completo. */
export default class Renderer implements IRenderer<IRenderableObject> {
  public canvas: Canvas;
  private camera: Camera;

  /** @constructor @param canvas A instância do `Canvas` onde o desenho ocorrerá. @param camera A instância da `Câmera` que define a viewport. */
  constructor(canvas: Canvas, camera: Camera) {
    this.canvas = canvas;
    this.camera = camera;
  }

  public async initialize(): Promise<void> {
    // O renderizador Canvas 2D não precisa de inicialização assíncrona,
    // então apenas retornamos uma promessa resolvida.
    return Promise.resolve();
  }

  /** Fase de Desenho: Limpa o canvas completamente, preparando-o para o desenho do próximo frame. */
  public clear(): void {
    this.canvas.clear();
  }

  /** Fase de Desenho: Orquestra o desenho de um único frame, aplicando a transformação da câmera e delegando o desenho do mapa e de cada objeto `IRenderable`. @param map O mapa do jogo a ser desenhado. @param world O estado do mundo, usado pela câmera. @param renderables Uma lista de objetos `IRenderable` a serem desenhados. */
  public async drawFrame(
    domainState: { world: WorldState; renderables: readonly IRenderableObject[] },
    cameraTarget: EntityRenderableState | undefined,
    map?: GameMap
  ): Promise<void> {
    const { ctx } = this.canvas;
    const { world, renderables } = domainState;

    ctx.save();
    this.camera.applyTransform(ctx, world);
    // Desenha o mapa se ele foi fornecido (no modo Canvas 2D)
    map?.draw(ctx);
    renderables.forEach(renderable => renderable.draw(ctx));
    ctx.restore();
  }
}