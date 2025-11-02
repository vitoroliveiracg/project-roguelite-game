import type ObjectElement from "../ObjectModule/ObjectElement";

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
export default class Quadtree {
  private boundary: IRectangle;
  private capacity: number;
  private objects: ObjectElement[] = [];
  private divided: boolean = false;

  // Filhos da Quadtree
  private northwest: Quadtree | null = null;
  private northeast: Quadtree | null = null;
  private southwest: Quadtree | null = null;
  private southeast: Quadtree | null = null;

  /**
   * @param boundary Os limites (x, y, largura, altura) deste nó da árvore.
   * @param capacity O número máximo de objetos que um nó pode conter antes de se subdividir.
   */
  constructor(boundary: IRectangle, capacity: number = 4) {
    this.boundary = boundary;
    this.capacity = capacity;
  }

  /**
   * Subdivide o nó atual em quatro quadrantes filhos.
   */
  private subdivide(): void {
    const { x, y, width, height } = this.boundary;
    const hw = width / 2; // half-width
    const hh = height / 2; // half-height

    // Cria os limites para cada um dos quatro novos quadrantes.
    const nw = { x: x, y: y, width: hw, height: hh };
    const ne = { x: x + hw, y: y, width: hw, height: hh };
    const sw = { x: x, y: y + hh, width: hw, height: hh };
    const se = { x: x + hw, y: y + hh, width: hw, height: hh };

    // Instancia os filhos.
    this.northwest = new Quadtree(nw, this.capacity);
    this.northeast = new Quadtree(ne, this.capacity);
    this.southwest = new Quadtree(sw, this.capacity);
    this.southeast = new Quadtree(se, this.capacity);

    this.divided = true;

    // Move os objetos deste nó para os filhos apropriados.
    for (const obj of this.objects) {
      this.northwest.insert(obj);
      this.northeast.insert(obj);
      this.southwest.insert(obj);
      this.southeast.insert(obj);
    }
    // Limpa os objetos do nó pai, pois agora eles residem nos filhos.
    this.objects = [];
  }

  /**
   * Insere um objeto na Quadtree.
   * @param object O objeto a ser inserido. Precisa ter `coordinates` e `size`.
   * @returns `true` se o objeto foi inserido com sucesso, `false` caso contrário.
   */
  public insert(object: ObjectElement): boolean {
    // Se o objeto não estiver dentro dos limites deste nó, ignore-o.
    if (!this.intersects(object)) {
      return false;
    }

    // Se o nó ainda tem capacidade, adiciona o objeto aqui.
    if (this.objects.length < this.capacity && !this.divided) {
      this.objects.push(object);
      return true;
    }

    // Se a capacidade foi atingida, subdivide o nó.
    if (!this.divided) {
      this.subdivide();
    }

    // Após subdividir, passa o objeto para os filhos tentarem inseri-lo.
    if (this.northwest!.insert(object)) return true;
    if (this.northeast!.insert(object)) return true;
    if (this.southwest!.insert(object)) return true;
    if (this.southeast!.insert(object)) return true;

    return false;
  }

  /**
   * Retorna uma lista de todos os objetos que podem colidir com o objeto fornecido.
   * @param object O objeto (ou área) para o qual se deseja encontrar colisões potenciais.
   * @returns Um array de `ObjectElement`s.
   */
  public retrieve(object: ObjectElement): ObjectElement[] {
    let found: ObjectElement[] = [];

    // Se a área de busca não intercepta este quadrante, não há o que fazer.
    if (!this.intersects(object)) {
      return found;
    }

    // Se o nó está dividido, busca recursivamente nos filhos.
    if (this.divided) {
      found = found.concat(this.northwest!.retrieve(object));
      found = found.concat(this.northeast!.retrieve(object));
      found = found.concat(this.southwest!.retrieve(object));
      found = found.concat(this.southeast!.retrieve(object));
    }

    // Adiciona os objetos deste nó (e de todos os filhos relevantes) à lista.
    // O filtro evita que um objeto seja comparado consigo mesmo.
    found.push(...this.objects.filter(obj => obj.id !== object.id));

    return found;
  }

  /**
   * Verifica se a caixa delimitadora de um objeto se sobrepõe aos limites deste nó.
   * @param object O objeto a ser verificado.
   */
  private intersects(object: ObjectElement): boolean {
    const objBounds = {
      x: object.coordinates.x,
      y: object.coordinates.y,
      width: object.size.width,
      height: object.size.height,
    };

    const boundary = this.boundary;

    // Verifica se não há sobreposição. Retorna a negação.
    return !(
      objBounds.x > boundary.x + boundary.width ||
      objBounds.x + objBounds.width < boundary.x ||
      objBounds.y > boundary.y + boundary.height ||
      objBounds.y + objBounds.height < boundary.y
    );
  }
}