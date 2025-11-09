/**
 * Define a interface para um retângulo, usada para limites e objetos.
 * A Quadtree precisa que os objetos tenham uma caixa delimitadora (bounding box).
 */
interface IRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Representa um nó em uma Quadtree.
 * Cada nó pode conter objetos ou ser subdividido em quatro sub-nós.
 */
export default class Quadtree<T> {
  private max_objects: number;
  private max_levels: number;
  private level: number;
  private elements: (T & IRectangle)[];
  private bounds: IRectangle;
  private nodes: Quadtree<T>[];

  /**
   * @param boundary Os limites (x, y, largura, altura) deste nó da árvore.
   * @param max_objects O número máximo de objetos que um nó pode conter antes de se subdividir.
   * @param max_levels A profundidade máxima da árvore.
   * @param level O nível de profundidade atual deste nó.
   */
  constructor(boundary: IRectangle, max_objects: number = 10, max_levels: number = 4, level: number = 0) {
    this.max_objects = max_objects;
    this.max_levels = max_levels;
    this.level = level;
    this.bounds = boundary;
    this.elements = [];
    this.nodes = [];
  }

  /**
   * Subdivide o nó atual em quatro quadrantes filhos.
   */
  private subdivide(): void {
    const nextLevel = this.level + 1;
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.nodes[0] = new Quadtree<T>({ x: x + subWidth, y: y, width: subWidth, height: subHeight }, this.max_objects, this.max_levels, nextLevel);
    this.nodes[1] = new Quadtree<T>({ x: x, y: y, width: subWidth, height: subHeight }, this.max_objects, this.max_levels, nextLevel);
    this.nodes[2] = new Quadtree<T>({ x: x, y: y + subHeight, width: subWidth, height: subHeight }, this.max_objects, this.max_levels, nextLevel);
    this.nodes[3] = new Quadtree<T>({ x: x + subWidth, y: y + subHeight, width: subWidth, height: subHeight }, this.max_objects, this.max_levels, nextLevel);
  }

  /**
   * Determina em qual quadrante um objeto pertence.
   * @param element O objeto a ser verificado.
   * @returns O índice do nó (0-3) ou -1 se não couber completamente em nenhum filho.
   */
  private getIndex(element: IRectangle): number {
    let index = -1;
    const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
    const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

    const topQuadrant = (element.y < horizontalMidpoint && element.y + element.height < horizontalMidpoint);
    const bottomQuadrant = (element.y > horizontalMidpoint);

    if (element.x < verticalMidpoint && element.x + element.width < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    } else if (element.x > verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }
    return index;
  }

  /** Insere um elemento na Quadtree. */
  public insert(element: T & IRectangle): void {
    if (this.nodes[0]) {
      const index = this.getIndex(element);

      // Se o elemento cabe em um quadrante filho, insira-o lá.
      if (index !== -1) {
        const node = this.nodes[index];
        if (node) { // Garante que o nó existe antes de usá-lo
          node.insert(element);
        }
        return;
      }
    }

    // Se não couber em nenhum filho (ou se o nó não foi subdividido),
    // adicione o elemento à lista deste nó.
    this.elements.push(element);

    if (this.elements.length > this.max_objects && this.level < this.max_levels) {
      // Se o nó estiver cheio e não tiver filhos, subdivida.
      if (!this.nodes[0]) {
        this.subdivide();
      }

      let i = 0;
      while (i < this.elements.length) {
        const element = this.elements[i];
        // Adiciona uma verificação de segurança para garantir que o elemento existe.
        if (!element) {
          i++;
          continue;
        }
        const index = this.getIndex(element);
        // Tente mover o elemento para um quadrante filho.
        if (index !== -1) {
          const node = this.nodes[index];
          if (node) { // Garante que o nó existe antes de usá-lo
            // Remove o elemento da lista atual e o insere no nó filho.
            // Usamos a variável 'element' que já sabemos que não é indefinida.
            node.insert(element);
            this.elements.splice(i, 1);
          } else { i++; } // Se o nó não existir, avança para evitar loop infinito.
        } else { 
          // Se não couber, deixe-o neste nó e vá para o próximo.
          i++;
        }
      }
    }
  }

  /**
   * Retorna uma lista de todos os objetos que podem colidir com o objeto fornecido.
   * @param object O objeto (ou área) para o qual se deseja encontrar colisões potenciais.
   * @returns Um array de `ObjectElement`s.
   */
  public retrieve(area: IRectangle): (T & IRectangle)[] {
    let returnElements = [...this.elements]; // Começa com os elementos deste nó

    // Se houver nós filhos, verifica em quais deles a área se sobrepõe
    if (this.nodes[0]) {
      const index = this.getIndex(area);

      // Se a área cabe inteiramente em um quadrante filho, busca apenas nele
      if (index !== -1) {
        const node = this.nodes[index];
        if (node) { // Garante que o nó existe antes de usá-lo
          returnElements = returnElements.concat(node.retrieve(area));
        }
      } else {
        // Se a área se sobrepõe a múltiplos filhos, busca em cada um deles
        for (let i = 0; i < this.nodes.length; i++) {
          const node = this.nodes[i];
          // A verificação 'intersects' evita buscar em quadrantes que não se tocam
          if (node && node.intersects(area)) {
            returnElements = returnElements.concat(node.retrieve(area));
          }
        }
      }
    }
    return returnElements;
  }

  /**
   * Verifica se a caixa delimitadora de um objeto se sobrepõe aos limites deste nó.
   * @param object O objeto a ser verificado.
   */
  private intersects(area: IRectangle): boolean {
    const boundary = this.bounds;

    // Verifica se não há sobreposição. Retorna a negação.
    return !(
      area.x > boundary.x + boundary.width ||
      area.x + area.width < boundary.x ||
      area.y > boundary.y + boundary.height ||
      area.y + area.height < boundary.y
    );
  }

  /** Limpa a Quadtree, removendo todos os elementos e nós filhos. */
  public clear(): void {
    this.elements = [];
    this.nodes = [];
  }
}