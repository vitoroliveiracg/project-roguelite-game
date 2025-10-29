import ObjectElement from "../ObjectElement";
import Vector2D from "../../shared/Vector2D";
import World from "../../World";
import { logger } from "../../../adapters/web/shared/Logger";

export default class Entity extends ObjectElement {

  
  //? ----------- Constructor -----------

  private _hp: number = 0;
  private _mana: number = 0;
  private _defence: number = 0;
  private _velocity: Vector2D = new Vector2D(0,0);

  constructor(
    id: number,
    coordinates: { x: number; y: number; },
    size: { width: number; height: number; },

    private _strength: number,
    private _inteligence: number,
    private _dexterity: number,
    private _wisdown: number,
    private _charisma: number,
    private _speed:number = 100
  ){ super(size, coordinates, id) }

  //? ----------- Methods -----------

  public move(world: World):void {
    //! --debug "colisão do personagem"
    
    this.coordinates.x = this.coordinates.x += this.velocity.x
    this.coordinates.y = this.coordinates.y += this.velocity.y
  }
  

  //? ----------- Getters and Setters -----------

  public get speed(): number { return this._speed; }
  public set speed(value: number) { 
    if(value > 0 ) this._speed = value;
  }

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

  public get velocity(): Vector2D { return this._velocity; }
  public set velocity(value: Vector2D) {
    // if(value > 0) this._velocity = value;
    this._velocity = value;
  }

}