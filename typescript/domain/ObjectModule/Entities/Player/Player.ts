//* import type World from "../../../World";
import Vector2D from "../../../shared/Vector2D";
import Entity from "../Entity";
import Atributes from "../Atributes";
import type IXPTable from "../IXPTable";
import { logger } from "../../../../adapters/web/shared/Logger";
import { gameEvents } from "../../../eventDispacher/eventDispacher";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import { SimpleBullet } from "../bullets/SimpleBullet";

export type playerStates = 'idle' | 'walking'

export default class Player extends Entity {

  private accelator:Vector2D = new Vector2D(0,0)
  private movementSinceLastUpdate: boolean = false;
  private isDashing: boolean = false;
  private shooted:boolean = false;

  constructor (
    id: number,
    coordinates : { x: number, y :number },
    atributes :Atributes,
    state: playerStates = 'idle'
  ){
    const size = { width: 16, height: 16 }; //? jogador (16x16)
    super(id, coordinates, size, 'player', state, atributes);
    
    this.hitboxes = [
      new HitBoxCircle(
        { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
        0, // rotation
        (other, self) => { /* Lógica de colisão do jogador aqui, se necessário */ },
        7 // radius
      )
    ];
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

      // Atualiza a posição de todas as hitboxes associadas
      this.hitboxes?.forEach(hb => hb.update(
        { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }, this.rotation
      ));

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


  private dashToDirection( direction:Vector2D ):void {
  
    if (!this.isDashing){

      this.accelator.add(direction.normalize()).multiply(3)
      this.isDashing = true
      
      setTimeout(() => {
          this.accelator.reset()
      }, 150);
      
      setTimeout(() => {
          this.isDashing = false
      }, 1000);
    }
  }

  private shootBullet( direction: Vector2D ) {
    if(!this.shooted){
      
      this.shooted = true

      gameEvents.dispatch('spawn', {
        factory: (id) => new SimpleBullet(
          id,
          {...this.coordinates},
          direction.normalize(),
        )
      });

      setTimeout(() => {
        this.shooted = false
      }, 250);
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
    this.dashToDirection(this.direction)
  }

  public onLeftClickAction( mouseLastCoordinates: {x:number;y:number} ): void {
    const direction = new Vector2D(
        mouseLastCoordinates.x - this.coordinates.x,
        mouseLastCoordinates.y - this.coordinates.y
      )
    this.shootBullet(direction)
  }

  public onRightClickAction( mouseLastCoordinates: {x:number;y:number} ): void {
    const direction = new Vector2D(
      mouseLastCoordinates.x - this.coordinates.x,
      mouseLastCoordinates.y - this.coordinates.y
    )
    
    this.dashToDirection(direction)
  }
}