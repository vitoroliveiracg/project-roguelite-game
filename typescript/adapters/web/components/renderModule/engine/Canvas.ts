/** @file Contém a classe Canvas, uma abstração para gerenciar o elemento HTMLCanvasElement e seu contexto 2D. */
/** @class Canvas Encapsula a criação e manipulação do elemento `<canvas>`. Seu papel é fornecer uma interface de alto nível para interagir com o canvas, como limpá-lo, e expor o elemento e seu contexto para outros componentes como o `Renderer` e a `Camera`. */
export default class Canvas {
  /** O elemento HTML `<canvas>` gerenciado por esta classe, exposto como `readonly` para componentes que precisam de acesso direto (ex: para estilização ou medição). */
  public readonly element: HTMLCanvasElement;
  /** O contexto de renderização 2D (`CanvasRenderingContext2D`) do canvas, exposto como `readonly` para que componentes de desenho possam operar sobre ele. */
  public readonly ctx: CanvasRenderingContext2D;

  /** @constructor Cria um novo elemento `<canvas>`, obtém seu contexto 2D, define suas dimensões iniciais e o anexa a um elemento container no DOM. @param container O elemento HTML pai onde o canvas será inserido. @param width A largura inicial do canvas em pixels. @param height A altura inicial do canvas em pixels. */
  constructor(container: HTMLElement, width: number, height: number) {
    this.element = document.createElement('canvas');
    this.element.width = width;
    this.element.height = height;

    const context = this.element.getContext('2d');
    if (!context) throw new Error('Não foi possível obter o contexto 2D do canvas.');
    this.ctx = context;

    container.appendChild(this.element);
  }

  /** Fase de Desenho: Limpa toda a área do canvas, preparando-o para o desenho do próximo frame. É tipicamente a primeira operação em um ciclo de desenho. */
  public clear(): void { this.ctx.clearRect(0, 0, this.element.width, this.element.height); }
}