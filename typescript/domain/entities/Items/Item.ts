import type Effect from "./Effect";
import type Entity from "./Entity";

export default abstract class Item {

  constructor(
    public readonly name: string,
    public readonly description :string,
    private _durability: number,
    private _effects: Effect[]
  ){}

  public use(target: Entity): void {
    this.effects.forEach(effect => effect.apply(target));
  }

  public get durability(): number { return this._durability; }
  public set durability(value: number) { 
    if(value > 0) this._durability = value 
  }

  public get effects(): Effect[] {
    return this._effects;
  }
  public set effects(value: Effect[]) {
    this._effects = value;
  }

}