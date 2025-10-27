export default class Canvas {
  public readonly element: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;

  constructor(container: HTMLElement, width: number, height: number) {
    this.element = document.createElement('canvas');
    this.element.width = width;
    this.element.height = height;

    const context = this.element.getContext('2d');
    if (!context) {
      throw new Error('Não foi possível obter o contexto 2D do canvas.');
    }
    this.ctx = context;

    // Adiciona o canvas ao corpo do documento ou a um container específico
    container.appendChild(this.element);
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.element.width, this.element.height);
  }
}