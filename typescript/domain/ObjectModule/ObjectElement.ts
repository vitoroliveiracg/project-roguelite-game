import type { objectTypeId } from "./objectType.type";

export default class ObjectElement {

  public rotation:number = 0

  constructor(
    readonly size: { width: number; height: number },
    private _coordinates: { x: number; y: number; },
    public id: number ,
    public state :any = "",
    private _objectId: objectTypeId
  ){}
  
  //? ----------- Getters and Setters -----------
  
  public get objectId(): objectTypeId { return this._objectId; }
  
  public get coordinates(): { x: number; y: number; } { return this._coordinates; }
  public set coordinates(value: { x: number; y: number; }) {
    this._coordinates = value;
  }

}