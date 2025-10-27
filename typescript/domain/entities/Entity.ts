export default class Entity {

  
  //? ----------- Constructor -----------

  private _hp: number = 0;
  private _mana: number = 0;
  private _defence: number = 0;
  private _velocity: number = 0;

  constructor(
    public readonly id: number,
    private _coordinates: { x: number; y: number; },
    public readonly size: { width: number; height: number; },

    private _strength: number,
    private _inteligence: number,
    private _dexterity: number,
    private _wisdown: number,
    private _charisma: number,
  ){}

  //? ----------- Methods -----------

  

  //? ----------- Getters and Setters -----------

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

  public get coordinates(): { x: number; y: number; } { return this._coordinates; }
  public set coordinates(value: { x: number; y: number; }) { this._coordinates = value; }


  public get defence(): number { return this._defence; }
  public set defence(value: number) { 
    if(value > 0 ) this._defence = value;
  }
  
  public get mana(): number { return this._mana; }
  public set mana(value: number) { 
    if(value >= 0 && value <= 100) this._mana = value; 
  }
  
  public get hp(): number { return this._hp; }
  public set hp(value: number) { 
    if(value > 0 ) this._hp = value;
  }

  public get velocity(): number { return this._velocity; }
  public set velocity(value: number) {
    if(value > 0) this._velocity = value;
  }

}