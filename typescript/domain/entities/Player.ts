import Entity from "./Entity";
import type World from "./World";

export default class Player extends Entity {
  
  public textToPrint = "diwaiodoawjioawd";

  constructor (
    id: number,
    public level :number,
    coordinates : { x: number, y :number },
    strength: number,
    inteligence: number,
    dexterity: number,
    wisdown: number,
    charisma: number,
  ){
    // O tamanho do jogador (16x16) é uma propriedade intrínseca da entidade.
    const size = { width: 16, height: 16 };
    super(id, coordinates, size, strength, inteligence, dexterity, wisdown, charisma);
  }
  
  public move(direction: 'up' | 'down' | 'left' | 'right', world: World): void {
    const speed = 5; // Define a velocidade do jogador

    let newX = this.coordinates.x;
    let newY = this.coordinates.y;

    if (direction === 'up') newY -= speed;
    if (direction === 'down') newY += speed;
    if (direction === 'left') newX -= speed;
    if (direction === 'right') newX += speed;

    // Garante que o jogador não saia dos limites do mundo, considerando seu tamanho.
    this.coordinates.x = Math.max(0, Math.min(newX, world.width - this.size.width));
    this.coordinates.y = Math.max(0, Math.min(newY, world.height - this.size.height));
  }

}