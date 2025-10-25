export default class Player {
  
  public textToPrint = "diwaiodoawjioawd";
  public coordinates = {
    x: 0,
    y: 0,
  }

  constructor(
    private _strength: number,
    private _inteligence: number,
    private _dexterity: number,
    private _wisdown: number,
    private _charisma: number,
  ) {}


  //? ----------- Getters and setters -----------

  public get strength(): number { return this._strength; }
  public set strength(value: number) { this._strength = value; }

  public get inteligence(): number { return this._inteligence; }
  public set inteligence(value: number) { this._inteligence = value; }

  public get dexterity(): number { return this._dexterity; }
  public set dexterity(value: number) { this._dexterity = value; }

  public get charisma(): number { return this._charisma; }
  public set charisma(value: number) { this._charisma = value; }

  public get wisdown(): number { return this._wisdown; }
  public set wisdown(value: number) { this._wisdown = value; }

}