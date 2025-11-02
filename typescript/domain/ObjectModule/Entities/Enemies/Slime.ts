import { gameEvents } from "../../../eventDispacher/eventDispacher";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import Dice from "../../../shared/Dice";
import type { objectTypeId } from "../../objectType.type";
import Enemy from "./Enemy";
import ObjectElement from "../../ObjectElement";
import Bullet from "../bullets/Bullet";
import Vector2D from "../../../shared/Vector2D";

export default class Slime extends Enemy {
  
  private lastPlayerPos: {x: number; y: number} = {x:0,y:0}

  //? ----------- Constructor -----------
  constructor(
    id :number,
    level :number,
    baseXp: number,
    coordinates :{ x:number, y:number },
    objectId :objectTypeId = "slime",
    atributes: { strength: number, dexterity: number, inteligence: number, wisdown: number, charisma: number, constitution: number }
  ){ 
    super(id, level, baseXp, coordinates, objectId, atributes, "waiting") 
    
    this.hitboxes = [
      new HitBoxCircle(
        { x: this.coordinates.x + super.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
        0,
        (otherElement: ObjectElement) => {
          if (otherElement instanceof Bullet) {
            super.takeDamage(otherElement);
          }
          if (otherElement instanceof Enemy ) {
            super.disperseFrom(otherElement)
          }
        },
        8
    )];
    
    this.atributes.hp = (Dice.rollDice(8) * level ) + this.atributes.constitution
    this.atributes.speed = -60
    
      
    this.setEvents();
  }

  //? ----------- Methods -----------

  public update(deltaTime: number): void {
    this.move(deltaTime);
  }

  private setEvents() {
    gameEvents.on("playerMoved", this.onLastPlayerPos.bind(this) )
  }

  

  public override move(deltaTime: number) {
    this.state = 'walking';
    const displacement = this.atributes.speed * deltaTime

    // Define a direção e magnitude da velocidade, mas sem o deltaTime.
    this.velocity = this.direction
      .normalize()
      .multiply(displacement)
      .add(this.accelator);
    
    super.updatePosition();
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

}