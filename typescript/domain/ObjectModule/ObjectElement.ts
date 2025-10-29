export default class ObjectElement {
  
  constructor(
    readonly size: { width: number; height: number },
    private _coordinates: { x: number; y: number; },
    public id: number 
  ){}
  
  //? ----------- Getters and Setters -----------
  
  public get coordinates(): { x: number; y: number; } {
    return this._coordinates;
  }
  public set coordinates(value: { x: number; y: number; }) {
    this._coordinates = value;
  }

}