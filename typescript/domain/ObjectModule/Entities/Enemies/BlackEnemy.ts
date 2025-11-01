import { logger } from "../../../../adapters/web/shared/Logger";
import { gameEvents } from "../../../eventDispacher/eventDispacher";
import Dice from "../../../shared/Dice";
import Vector2D from "../../../shared/Vector2D";
import type { objectTypeId } from "../../objectType.type";
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

    this.setEvents()
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
    this.move(deltaTime)
    
    this.direction.reset()
  }

  public onLastPlayerPos( playerCoordinates: {x: number; y: number} ) {
    this.lastPlayerPos.x = playerCoordinates.x
    this.lastPlayerPos.y = playerCoordinates.y

    this.direction.x = playerCoordinates.x - this.coordinates.x
    this.direction.y = playerCoordinates.y - this.coordinates.y
  }

  //? ----------- Getters and Setters -----------

}