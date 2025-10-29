/** * Representa o mundo do jogo. Esta entidade de domínio é a fonte da verdade para as dimensões do mundo, independentemente de como ele é renderizado visualmente. */
export default class World {
  constructor(
    public readonly width: number,
    public readonly height: number
  ) {}
}