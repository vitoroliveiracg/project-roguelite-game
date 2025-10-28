import Entity from "./Entity";
import type World from "./World";

export default class Player extends Entity {
  
  private state: 'idle' | 'walking' = 'idle';
  private movementSinceLastUpdate: boolean = false;

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
  
  public move(direction: 'up' | 'down' | 'left' | 'right', world: World, deltaTime: number): void {
    this.state = 'walking';
    this.movementSinceLastUpdate = true;
    const speed = 100; // Define a velocidade do jogador em pixels por segundo.
    const displacement = speed * deltaTime; // Calcula o deslocamento para este frame.

    let newX = this.coordinates.x;
    let newY = this.coordinates.y;

    if (direction === 'up') newY -= displacement;
    if (direction === 'down') newY += displacement;
    if (direction === 'left') newX -= displacement;
    if (direction === 'right') newX += displacement;

    // Garante que o jogador não saia dos limites do mundo, considerando seu tamanho.
    this.coordinates.x = Math.max(0, Math.min(newX, world.width - this.size.width));
    this.coordinates.y = Math.max(0, Math.min(newY, world.height - this.size.height));
  }

  /** Avança o estado interno do jogador. Chamado a cada frame pelo DomainFacade. */
  public update(deltaTime: number): void {
    // Se não houve um comando de movimento desde o último update, o jogador está parado.
    if (!this.movementSinceLastUpdate) {
      this.state = 'idle';
    }
    // Reseta a flag para o próximo ciclo de update.
    this.movementSinceLastUpdate = false;
  }

  /** Retorna o estado atual do jogador. */
  public getState(): 'idle' | 'walking' {
    return this.state;
  }
}