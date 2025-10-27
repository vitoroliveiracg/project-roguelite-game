import type Entity from "./Entity";

export default abstract class Effect {
  
  constructor(
    public readonly name: string,
    public readonly description: string
  ){}
  
  
  //? ----------- Methods -----------

  public abstract apply (entity :Entity) :void

}