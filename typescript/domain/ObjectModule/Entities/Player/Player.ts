//* import type World from "../../../World";
import Vector2D from "../../../shared/Vector2D";
import Entity from "../Entity";
import Atributes from "../Atributes";
import type IXPTable from "../IXPTable";
import { logger } from "../../../../adapters/web/shared/Logger";
import { gameEvents } from "../../../eventDispacher/eventDispacher";

export type playerStates = 'idle' | 'walking'

export default class Player extends Entity {

  private accelator:Vector2D = new Vector2D(0,0)
  private movementSinceLastUpdate: boolean = false;
  private isDashing: boolean = false;

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
  public override move( deltaTime: number): void {
    this.state = 'walking';
    this.movementSinceLastUpdate = true;
    const displacement = this.atributes.speed * deltaTime

    // Define a direção e magnitude da velocidade, mas sem o deltaTime.
    this.velocity = this.direction
      .normalize()
      .multiply(displacement)
      .add(this.accelator);
    
    this.updatePosition();
  }

  /** Avança o estado interno do jogador. Chamado a cada frame pelo DomainFacade. */
  public update(deltaTime: number): void {
    this.move(deltaTime)
    if (!this.movementSinceLastUpdate)  this.state = 'idle';
    
    this.movementSinceLastUpdate = false;
    
    this.direction.reset()
  }

  protected override updatePosition() {
      this.coordinates.x += this.velocity.x;
      this.coordinates.y += this.velocity.y;

      gameEvents.dispatch("playerMoved", { x: this.coordinates.x, y: this.coordinates.y })
      logger.log("domain", "(Entity) player moved");
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


  private dash(x:number|undefined = undefined, y:number|undefined = undefined):void {
  
    if (!this.isDashing){
      if(x && y){
        this.direction.x = x - this.coordinates.x
        this.direction.y = y - this.coordinates.y
      }

      this.accelator.add(this.direction.normalize()).multiply(3)
      this.isDashing = true
      
      setTimeout(() => {
          this.accelator.reset()
      }, 150);
      
      setTimeout(() => {
          this.isDashing = false
      }, 1000);
    }
  }

  //? ----------- On input methods -----------

  public onUpAction (): void {
    this.direction.y -= 1
  }

  public onDownAction (): void {
    this.direction.y += 1
  }

  public onLeftAction (): void {
    this.direction.x -= 1
  }

  public onRightAction (): void {
    this.direction.x += 1
  }

  public onShiftAction (): void {
    this.dash()
  }

  public onLeftClickAction( mouseLastCoordinates: {x:number;y:number} ): void {
    this.dash(mouseLastCoordinates.x, mouseLastCoordinates.y)
  }

  public onRightClickAction( mouseLastCoordinates: {x:number;y:number} ): void {
    this.dash(mouseLastCoordinates.x, mouseLastCoordinates.y)
  }
}