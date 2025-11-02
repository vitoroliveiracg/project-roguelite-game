import { gameEvents } from "../../../eventDispacher/eventDispacher";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import type ObjectElement from "../../ObjectElement";
import Dice from "../../../shared/Dice";
import Vector2D from "../../../shared/Vector2D";
import type { objectTypeId } from "../../objectType.type";
import { SimpleBullet } from "../bullets/SimpleBullet";
import Enemy from "./Enemy";

export default class BlackEnemy extends Enemy {
  
  private lastPlayerPos: {x: number; y: number} = {x:0,y:0}
  private accelator:Vector2D = new Vector2D(0,0)
  private movementSinceLastUpdate: boolean = false;

  //? ----------- Constructor -----------
  constructor(
    id :number,
    level :number,
    baseXp: number,
    coordinates :{ x:number, y:number },
    objectId :objectTypeId = "blackEnemy",
    atributes: { strength: number, dexterity: number, inteligence: number, wisdown: number, charisma: number, constitution: number }
  ){ 
    super(id, level, baseXp, coordinates, objectId, atributes, "waiting") 
    
    this.atributes.hp = (Dice.rollDice(8) * level ) + this.atributes.constitution
    this.atributes.speed = -60

    this.hitboxes = [
      new HitBoxCircle(
        { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
        0, // rotation
        (otherElement: ObjectElement, selfElement: ObjectElement) => {
          if (otherElement instanceof SimpleBullet) {
            this.takeDamage(otherElement.damage, otherElement.id);
          }
        },
        8 // radius
      )];

    this.setEvents();
  }

  //? ----------- Methods -----------


  private setEvents() {
    gameEvents.on("playerMoved", this.onLastPlayerPos.bind(this) )
  }

  public override move(deltaTime: number) {
    this.state = 'walking';
    this.movementSinceLastUpdate = true;
    const displacement = this.atributes.speed * deltaTime

    // Define a direção e magnitude da velocidade, mas sem o deltaTime.
    this.velocity = this.direction
      .normalize()
      .multiply(displacement)
      .add(this.accelator);
    
    super.updatePosition();
  }

  public update(deltaTime: number): void {
    this.move(deltaTime);
  }

  public onLastPlayerPos( playerCoordinates: {x: number; y: number} ) {
    this.lastPlayerPos.x = playerCoordinates.x
    this.lastPlayerPos.y = playerCoordinates.y

    this.direction.x = playerCoordinates.x - this.coordinates.x
    this.direction.y = playerCoordinates.y - this.coordinates.y

    // Atualiza a posição de todas as hitboxes associadas
    this.hitboxes?.forEach(hb => hb.update(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }, this.rotation
    ));
  }

  //? ----------- Getters and Setters -----------

}