/**
 * Define o contrato para qualquer objeto que possa ser desenhado na tela.
 * Esta é uma abstração da camada de apresentação.
 * Cada implementação (e.g., Shape, Sprite) encapsula sua própria lógica de desenho.
 */
export default interface IRenderable {
  id: number;
  readonly coordinates: { x: number; y: number }; // Expose coordinates for the camera
  readonly size: { width: number; height: number }; // Expose size for the camera
  draw(ctx: CanvasRenderingContext2D): void;
  updateState(newState: any): void; // Método para atualizar o estado a partir do DTO do domínio
}