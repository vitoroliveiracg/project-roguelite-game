import Dice from "../../../shared/Dice";
import type { objectTypeId } from "../../objectType.type";
import Enemy from "./Enemy";

export default class BlackEnemy extends Enemy {
  
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
  }

  //? ----------- Methods -----------

  

  //? ----------- Getters and Setters -----------

}