import ObjectElement from "../ObjectElement";
import Vector2D from "../../shared/Vector2D";
//* import World from "../../World";
import { logger } from "../../../adapters/web/shared/Logger";
import type { objectTypeId } from "../objectType.type";
import type IAtributes from "./IAtributes";

export default class Entity extends ObjectElement {
  private _hp: number = 0;
  private _mana: number = 0;
  private _defence: number = 0;

  private _velocity: Vector2D = new Vector2D(0,0);
  
  
  //? ----------- Constructor -----------
  constructor(
    id: number,
    coordinates: { x: number; y: number; },
    size: { width: number; height: number; },
    objectId: objectTypeId,
    state :any,

    private atributes :IAtributes,
    private _speed :number = 0,
  ){ super(size, coordinates, id, state, objectId) }

  //? ----------- Methods -----------

  //* world: World
  public move(deltaTime: number):void {
    //! --debug "colisão do personagem"
    
    //? Calcula o deslocamento para este frame (velocidade * tempo) e o aplica.
    this.coordinates.x += this.velocity.x * deltaTime;
    this.coordinates.y += this.velocity.y * deltaTime;
    
    logger.log("domain", "(Entity) moved");
  }
  

  //? ----------- Getters and Setters -----------

  public get speed(): number { return this._speed; }
  public set speed(value: number) { 
    if(value > 0 ) this._speed = value;
  }
  public get velocity(): Vector2D { return this._velocity; }
  public set velocity(value: Vector2D) { this._velocity = value; }

  public get strength(): number { return this.atributes.strength; }
  public set strength(value: number) { this.atributes.strength = value; }

  public get inteligence(): number { return this.atributes.inteligence; }
  public set inteligence(value: number) { this.atributes.inteligence = value; }

  public get dexterity(): number { return this.atributes.dexterity; }
  public set dexterity(value: number) { this.atributes.dexterity = value; }

  public get charisma(): number { return this.atributes.charisma; }
  public set charisma(value: number) { this.atributes.charisma = value; }

  public get wisdown(): number { return this.atributes.wisdown; }
  public set wisdown(value: number) { this.atributes.wisdown = value; }


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

}