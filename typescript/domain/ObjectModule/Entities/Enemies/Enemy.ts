import type { objectTypeId } from "../../objectType.type";
import Entity from "../Entity";
import type IAtributes from "../IAtributes";

export default class Enemy extends Entity {
    
  constructor (
    id: number,
    public level :number,
    coordinates : { x: number, y :number },
    objectId: objectTypeId,
    atributes :IAtributes,
    state: any
  ){
    const size = { width: 16, height: 16 };
    super(id, coordinates, size, objectId, state, atributes);
  }
}