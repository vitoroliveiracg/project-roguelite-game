import type { objectTypeId } from "../../objectType.type";
import type IAtributes from "../IAtributes";
import Enemy from "./Enemy";

export default class BlackEnemy extends Enemy {
  
  //? ----------- Constructor -----------

  constructor(
    id :number,
    level :number,
    coordinates :{ x:number, y:number },
    objectId :objectTypeId = "blackEnemy",
    atributes :IAtributes

  ){ super(id, level, coordinates, objectId, atributes, "waiting") }

  //? ----------- Methods -----------

  

  //? ----------- Getters and Setters -----------

}