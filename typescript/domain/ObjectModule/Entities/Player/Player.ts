//* import type World from "../../../World";
import Vector2D from "../../../shared/Vector2D";
import Entity from "../Entity";
import Atributes from "../Atributes";
import type IXPTable from "../IXPTable";

export type playerStates = 'idle' | 'walking'

export default class Player extends Entity {

  private accelator:Vector2D = new Vector2D(0,0)
  private movementSinceLastUpdate: boolean = false;
  
  constructor (
    id: number,
    coordinates : { x: number, y :number },
    atributes :Atributes,
    state: playerStates = 'idle'
  ){
    const size = { width: 16, height: 16 }; //? jogador (16x16)
    super(id, coordinates, size, 'player', state, atributes);
  }
  
  //* world: World
  public movePlayer(direction: Array<'up' | 'down' | 'left' | 'right'>, deltaTime: number): void {
    this.state = 'walking';
    this.movementSinceLastUpdate = true;

    const direction_vector = new Vector2D(0,0)

    direction.map( dir=>{
      if (dir === 'up') direction_vector.y -= 1;
      if (dir === 'down') direction_vector.y += 1;
      if (dir === 'left') direction_vector.x -= 1;
      if (dir === 'right') direction_vector.x += 1;
    } )

    direction_vector.normalize()
    
    // Define a direção e magnitude da velocidade, mas sem o deltaTime.
    this.velocity = direction_vector.multiply(this.atributes.speed).add(this.accelator);
    
    super.move(deltaTime);
  }

  /** Avança o estado interno do jogador. Chamado a cada frame pelo DomainFacade. */
  public override update(deltaTime: number): void {
    if (!this.movementSinceLastUpdate)  this.state = 'idle';
    
    this.movementSinceLastUpdate = false;
  }

  /**
   * Adiciona experiência ao jogador.
   * @param xpAmount A quantidade de experiência a ser adicionada.
   * @param xpTable A tabela de progressão de XP.
   */
  public gainXp(xpAmount: number, xpTable: IXPTable): void {
    this.atributes.addXp(xpAmount, xpTable);
  }

  /** Retorna o estado atual do jogador. */
  public getState(): 'idle' | 'walking' {
    return this.state;
  }
}