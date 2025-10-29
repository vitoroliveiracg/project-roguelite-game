
import type World from "../../../World";
import Vector2D from "../../../shared/Vector2D";
import Entity from "../Entity";

export default class Player extends Entity {
  
  private state: 'idle' | 'walking' = 'idle';
  private movementSinceLastUpdate: boolean = false;

  public textToPrint = "diwaiodoawjioawd";
  private accelator:Vector2D = new Vector2D(0,0)

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
  
  public movePlayer(direction: Array<'up' | 'down' | 'left' | 'right'>, world: World, deltaTime: number): void {
    this.state = 'walking';
    this.movementSinceLastUpdate = true;
    const displacement = this.speed * deltaTime;

    const direction_vector = new Vector2D(0,0)

    direction.map( dir=>{
      if (dir === 'up') direction_vector.y -= 1;
      if (dir === 'down') direction_vector.y += 1;
      if (dir === 'left') direction_vector.x -= 1;
      if (dir === 'right') direction_vector.x += 1;
    } )

    direction_vector.normalize()
    this.velocity = direction_vector.multiply(displacement).add(this.accelator)
    
    super.move(world)
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