/** @file Define o contrato `IRenderable` para todos os objetos que podem ser desenhados na tela, garantindo polimorfismo na camada de renderização. */

/** @interface IRenderable Define o contrato para qualquer objeto que possa ser desenhado na tela. Esta é a abstração fundamental da camada de apresentação, permitindo que o `Renderer` trate diferentes tipos de objetos visuais (Sprites, formas, etc.) de maneira uniforme. */
export default interface IRenderable {
  /** O identificador único da entidade de domínio que este objeto representa, usado para rastreamento. */
  id: number;
  /** As coordenadas {x, y} do objeto no mundo do jogo, expostas como `readonly` para uso pela Câmera e pelo Renderer. */
  readonly coordinates: { x: number; y: number };
  /** As dimensões {width, height} do objeto, expostas como `readonly` para uso pela Câmera e pelo Renderer. */
  readonly size: { width: number; height: number };
  /** Rotação do objeto, em radianos */
  readonly rotation:number
  /** Fase de Desenho: Executa a lógica de desenho específica do objeto (ex: desenhar um sprite, uma forma) no contexto do canvas. @param ctx O contexto de renderização 2D do canvas. */
  draw(ctx: CanvasRenderingContext2D): void;
  /** Fase de Update (Sincronização): Atualiza o estado interno do objeto visual com os novos dados (DTO) vindos da camada de domínio. @param newState O DTO de estado mais recente da entidade correspondente. */
  updateState(newState: any): void;

}