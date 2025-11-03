import { gameEvents } from "../../../eventDispacher/eventDispacher";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import Dice from "../../../shared/Dice";
import Vector2D from "../../../shared/Vector2D";
import type { objectTypeId } from "../../objectType.type";
import Enemy from "./Enemy";
import ObjectElement from "../../ObjectElement";
import Attribute from "../Attributes";

export default class Slime extends Enemy {
  
  private lastPlayerPos: {x: number; y: number} = {x:0,y:0}
  private readonly speedModifier: number = 0.50;

  //? ----------- Constructor -----------
  constructor(
    id :number,
    level :number,
    baseXp: number,
    coordinates :{ x:number, y:number },
    attributes: Attribute,
    objectId :objectTypeId = "slime",
  ){ 
    super(id, level, baseXp, coordinates, objectId, attributes, "waiting") 
    
    this.hitboxes = [this.setHitbox()];
    this.attributes.hp = (Dice.rollDice(8) * level ) + this.attributes.constitution
      
    this.setEvents();
  }

  //? ----------- Methods -----------

  public update(deltaTime: number): void {
    
    gameEvents.dispatch('requestNeighbors', {
      requester: this,
      radius: this.size.width,
      callback: (neighbors) => this.moveSlime(deltaTime, neighbors)
    });


  }

  private setEvents() {
    gameEvents.on("playerMoved", this.onLastPlayerPos.bind(this) )
  }

  private setHitbox() :HitBoxCircle {
    
    return new HitBoxCircle(
      { x: this.coordinates.x + super.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
      0,
      8,
      (otherElement: ObjectElement) => {

        if (otherElement instanceof Enemy && otherElement.id !== this.id) {
          super.disperseFrom(otherElement)
        }

      }
    )

  }

  public moveSlime(deltaTime: number, neighbors: ObjectElement[]): void {
    this.state = 'walking';
  
    const primaryDirection = new Vector2D(
      this.lastPlayerPos.x - this.coordinates.x,
      this.lastPlayerPos.y - this.coordinates.y
    ).normalize();
  
    // Função auxiliar para verificar se uma direção causa colisão
    const willCollideInDirection = (direction: Vector2D): boolean => {
      const displacement = direction.multiply(this.attributes.speed * this.speedModifier * deltaTime);
      const nextPosition = { x: this.coordinates.x + displacement.x, y: this.coordinates.y + displacement.y };
      const futureHitbox = new HitBoxCircle({ x: nextPosition.x + this.size.width / 2, y: nextPosition.y + this.size.height / 2 }, 0, 8, () => {});
  
      for (const other of neighbors) {
        if (other instanceof Slime && other.id !== this.id) {
          const otherHitbox = other.hitboxes?.[0];
          if (otherHitbox && futureHitbox.intersects(otherHitbox)) {
            return true;
          }
        }
      }
      return false;
    };
  
    let finalDirection = null;
  
    if (!willCollideInDirection(primaryDirection)) {
      finalDirection = primaryDirection;
    } else {

      const leftDirection = primaryDirection.clone().rotate(-45);
      const rightDirection = primaryDirection.clone().rotate(45);
  
      if (!willCollideInDirection(leftDirection)) {
        finalDirection = leftDirection;
      } else if (!willCollideInDirection(rightDirection)) {
        finalDirection = rightDirection;
      }
    }
  
    if (finalDirection) {
      this.velocity = finalDirection.multiply(this.attributes.speed * this.speedModifier * deltaTime);
      super.updatePosition();
    } else {
      this.velocity.reset();
    }
  }

  public onLastPlayerPos( playerCoordinates: {x: number; y: number} ) {
    this.lastPlayerPos.x = playerCoordinates.x
    this.lastPlayerPos.y = playerCoordinates.y

    this.hitboxes?.forEach(hb => hb.update(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }, this.rotation
    ));
  }

}