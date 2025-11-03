//* import type World from "../../../World";
import Vector2D from "../../../shared/Vector2D";
import Entity from "../Entity";
import Attributes from "../Attributes";
import type IXPTable from "../IXPTable";
import { logger } from "../../../../adapters/web/shared/Logger";
import { gameEvents } from "../../../eventDispacher/eventDispacher";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import { SimpleBullet } from "../bullets/SimpleBullet";
import type ObjectElement from "../../ObjectElement";
import Enemy from "../Enemies/Enemy";
import Attack from "../../Items/Attack";
import { type DamageInfo } from "../Entity";

export type playerStates = 'idle' | 'walking'

export default class Player extends Entity {

  private movementSinceLastUpdate: boolean = false;
  private isDashing: boolean = false;
  private shooted:boolean = false;

  constructor (
    id: number,
    coordinates : { x: number, y :number },
    attributes :Attributes,
    state: playerStates = 'idle'
  ){
    const size = { width: 16, height: 16 }; //? jogador (16x16)
    super(id, coordinates, size, 'player', state, attributes);
    
    this.hitboxes = [ ...this.setHitboxes() ];
  }

  private setHitboxes () :HitBoxCircle[]{

    return [new HitBoxCircle(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
      0,
      7,
      (otherElement: ObjectElement) => {
        if (otherElement instanceof Enemy){
          const enemyAttack = otherElement.onStrike();
          
          if (enemyAttack) {
            const directionToPlayer = new Vector2D(this.coordinates.x - otherElement.coordinates.x, this.coordinates.y - otherElement.coordinates.y).normalize();
            enemyAttack.execute(this, directionToPlayer);
          }
        }
      }
    )]
  }


  /** Avança o estado interno do jogador. Chamado a cada frame pelo DomainFacade. */
  public update(deltaTime: number): void {
    this.move(deltaTime)
    if (!this.movementSinceLastUpdate)  this.state = 'idle';
    
    this.movementSinceLastUpdate = false;
    
    this.direction.reset()
  }

  /**
   * Sobrescreve o método takeDamage para adicionar uma lógica específica do jogador:
   * disparar o evento 'playerDied' quando sua vida chega a zero.
   */
  public override takeDamage(damageInfo: DamageInfo): number {
    const damageDealt = super.takeDamage(damageInfo);

    if (this.attributes.hp <= 0) {
      gameEvents.dispatch('playerDied', {});
    }

    return damageDealt;
  }

  protected override updatePosition() {
    this.coordinates.x += this.velocity.x;
    this.coordinates.y += this.velocity.y;

    this.hitboxes?.forEach(hb => hb.update(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }, this.rotation
    ));

    gameEvents.dispatch("playerMoved", { x: this.coordinates.x, y: this.coordinates.y })
    logger.log("domain", "(Entity) player moved");
  }

  //? ----------- Main actions -----------


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

      const baseDamage = 10 * (this.attributes.level + 2)  + Math.floor(this.attributes.strength / 2);

      const playerAttack = new Attack(
        this,
        baseDamage,
        'physical'
      );

      gameEvents.dispatch('spawn', {
        factory: (id) => new SimpleBullet(id, {...this.coordinates}, direction.normalize(), playerAttack)
      });

      setTimeout(() => {
        this.shooted = false
      }, 100);
    }
  }

  public override move( deltaTime: number): void {
    this.state = 'walking';
    this.movementSinceLastUpdate = true;
    const displacement = this.attributes.speed * deltaTime

    this.velocity = this.direction
      .normalize()
      .multiply(displacement)
      .add(this.accelator);
    
    this.updatePosition();
  }

  //? ----------- On Input Handlers -----------

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

  //? ----------- Helpers -----------

  /** * Adiciona experiência ao jogador. * @param xpAmount A quantidade de experiência a ser adicionada. * @param xpTable A tabela de progressão de XP. */
  public gainXp(xpAmount: number, xpTable: IXPTable): void {
    this.attributes.addXp(xpAmount, xpTable);
  }
  /** Retorna o estado atual do jogador. */
  public getState(): 'idle' | 'walking' {
    return this.state;
  }

}