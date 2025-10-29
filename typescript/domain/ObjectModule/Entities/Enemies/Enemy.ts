import Entity from "../Entity";

export default class Enemy extends Entity {
    
  constructor (
    id: number,
    public level :number,
    coordinates : { x: number, y :number },
    strength: number,
    inteligence: number,
    dexterity: number,
    wisdown: number,
    charisma: number,
  ){
    const size = { width: 16, height: 16 };
    super(id, coordinates, size, strength, inteligence, dexterity, wisdown, charisma);
  }
}