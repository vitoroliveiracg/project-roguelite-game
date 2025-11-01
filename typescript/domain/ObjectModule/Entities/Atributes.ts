import Dice from "../../shared/Dice";
import type IXPTable from "./IXPTable";

export default class Atributes {

  private _hp: number = 0;
  private _mana: number = 0;
  private _currentXp: number = 0;
  private _xpToNextLevel: number = 0;

  //? Modificação vai ser pelos bonus
  private _bonusSpeed: number = 0;
  private _bonusCritDamage: number = 0;
  private _bonusCritChance: number = 0;
  private _bonusSplashDamage: number = 0;
  private _bonusLucky: number = 0;
  private _bonusPircing: number = 0;
  private _bonusAccuracity: number = 0;
  private _bonusRecharge: number = 0;
  private _bonusTenacity: number = 0;
  private _bonusVigor: number = 0;
  private _bonusDodge: number = 0;
  private _bonusInsight: number = 0;

  constructor(
    hpDiceFaces :number,
    private _level: number, 
    
    private _strength: number,
    private _constitution: number,
    private _dexterity: number,
    private _inteligence: number,
    private _wisdown: number,
    private _charisma: number,
  ){ 
    this.setHp(hpDiceFaces * this.level);
    this._mana = this.maxMana;
    // Inicializa o XP necessário para o primeiro level up.
  }
  
  //? ----------- Methods -----------
  
  private setHp(hpDiceFaces :number){
    for (let i = 0; i < hpDiceFaces; i++) 
      this._hp += Dice.rollDice(hpDiceFaces);
  }

  /**
   * Adiciona experiência e verifica se a entidade subiu de nível.
   * @param xpAmount A quantidade de experiência a ser adicionada.
   * @param xpTable A tabela de XP que define a curva de progressão.
   */
  public addXp(xpAmount: number, xpTable: IXPTable) {
    this._currentXp += xpAmount * (1 + (this.insight / 100)); // Aplica o bônus de Insight

    // Inicializa o XP para o próximo nível se ainda não foi feito
    if (this._xpToNextLevel === 0) {
      this._xpToNextLevel = xpTable.fixedBase * Math.pow(xpTable.levelScale, this._level - 1);
    }

    while (this._currentXp >= this._xpToNextLevel) {
      this._currentXp -= this._xpToNextLevel;
      this._level++;
      this._xpToNextLevel = xpTable.fixedBase * Math.pow(xpTable.levelScale, this._level - 1);
      // Aqui você pode disparar um evento de "level up"!
    }
  }
  
  //? ----------- Helpers -----------

  private getBestAtributeOfAll() :number{
    return this.getBestAtribute(this.strength,  this.constitution, this.dexterity, this.inteligence, this.wisdown, this.charisma);
  }

  private getBestAtribute(...atributes :number[]) :number{
    let bestAtribute = 0;

    atributes.forEach(element => {
      if(element > bestAtribute) bestAtribute = element
    })

    return bestAtribute;
  }

  //? ----------- Atributos Complexos -----------
  
  /** Current Health Points. */
  public get hp(): number { return this._hp; }
  
  /** Current Mana Points. */
  public get mana() :number { return this._mana; }
  /** Maximum Mana Points. Based on the best between Inteligence, Wisdom, and Charisma. */
  public get maxMana() :number {  return this.getBestAtribute(this.inteligence, this.wisdown, this.charisma) * 10 }
  
  /** |  (this.constitution / 10 ) + (this.dexterity / 10)  | @returns returns damage cap*/
  public get defence(){ return (this.constitution / 10 ) + (this.dexterity / 10) }

  /** The current level of the entity. */
  public get level(): number { return this._level; }
  /** The current experience points. */
  public get currentXp(): number { return this._currentXp; }


  /** Entity's movement speed modifier. Based on Dexterity. */
  public get speed(): number { return 100 + (this.dexterity / 10) + this._bonusSpeed; }
  public get speedDescription(): string { return "Entity velocity modifier"  }
  
  /** Critical hit damage multiplier. Base 150% + 2% per point of the best attribute. @returns percentage value */
  public get critDamage(): number { return 150 + (this.getBestAtributeOfAll() * 2) + this._bonusCritDamage; }
  public get critDamageDescription(): string { return "Crit damage multiplier. x1,5 + x0,02 for each point of your best attribute."  }
  
  /** The chance to land a critical hit, as a percentage. Formula: 3% base + (Best Attribute / 10) + Lucky. @returns percentage value */
  public get critChance(): number { return 3 + ( this.getBestAtributeOfAll() / 10 ) + this.lucky + this._bonusCritChance; }
  public get critChanceDescription(): string { return "Determines the probability of landing a critical hit. Base chance is 3%, increased by your best attribute and luck."  }

  /** Percentage of damage dealt in an area around the main target. Based on the best attribute. @returns percentage value */
  public get splashDamage(): number { return (this.getBestAtributeOfAll() * 0.2) + this._bonusSplashDamage; }
  public get splashDamageDescription(): string { return "Deals a percentage of damage to enemies around the target. 0.2% of best attribute."  }

  /** Modificador de coisas baseadas em chance acontecerem (drop de itens, crit) | (this.charisma + this.wisdown) /2 ) / 10 | @returns percentage value  */
  public get lucky(): number { return Math.floor( ( (this.charisma + this.wisdown) /2 ) / 10) + this._bonusLucky; }
  public get luckyDescription(): string { return "Increases the chance of fortunate events, such as finding better items or landing critical hits."  }
  
  /** Number of enemies a projectile can pierce. Based on Dexterity. */
  public get pircing(): number { return Math.floor(this.dexterity / 10) + this._bonusPircing; }
  public get pircingDescription(): string { return "The number of enemies a projectile can pierce through." }

  /** Chance to magically hit a nearby target if the attack would otherwise miss. @returns percentage value */
  public get accuracity(): number { return (this.dexterity * 0.5) + this._bonusAccuracity; }
  public get accuracityDescription(): string { return "Chance to hit a nearby enemy even if you miss." }

  /** Reduces the cooldown of abilities. Based on Dexterity. @returns percentage value */
  public get recharge(): number { return (this.dexterity * 0.25) + this._bonusRecharge; }
  public get rechargeDescription(): string { return "Reduces the cooldown time of your abilities." }

  /** Reduces the duration of crowd control effects on you. Based on Constitution, Wisdom, and Inteligence. @returns percentage value */
  public get tenacity(): number { return this.getBestAtribute( this.constitution, this.wisdown, this.inteligence ) * 0.5; }
  public get tenacityDescription(): string { return "Reduces the duration of crowd control effects like stuns and slows." }

  /** Increases the effectiveness of healing received. Based on Constitution. @returns percentage value */
  public get vigor(): number { return this.constitution * 0.5; }
  public get vigorDescription(): string { return "Increases the amount of health recovered from all sources." }

  /** Chance to completely avoid an incoming attack. Based on Dexterity. @returns percentage value*/
  public get dodge(): number { return (this.dexterity * 0.2) + this._bonusDodge; }
  public get dodgeDescription(): string { return "The chance to completely avoid an incoming attack." }

  /** Regeneração de mana por segundo. Ex: 0.1 por ponto de inteligência. */
  public get manaRegen(): number { return this.inteligence * 0.1; }
  public get manaRegenDescription(): string { return "Amount of mana regenerated per second." }

  /** Regeneração de vida por segundo | 0.5 * constituição | */
  public get hpRegen(): number { return this.constitution * 0.5; }
  public get hpRegenDescription(): string { return "Amount of health regenerated per second." }

  /** Bonus to experience points gained. Based on Wisdom. @returns percentage value */
  public get insight(): number { return (this.wisdown / 10) + this._bonusInsight; }
  public get insightDescription(): string { return "Increases the amount of experience points gained." }


  public set hp(value: number) { this._hp += value; }
  public set mana(value: number) { this._mana = Math.max(0, Math.min(this.maxMana, this._mana + value)); }
  public set speed(value: number) { this._bonusSpeed += value; }
  public set critDamage(value: number) { this._bonusCritDamage += value; }
  public set critChance(value: number) { this._bonusCritChance += value; }
  public set splashDamage(value: number) { this._bonusSplashDamage += value; }
  public set lucky(value: number) { this._bonusLucky += value; }
  public set pircing(value: number) { this._bonusPircing += value; }
  public set accuracity(value: number) { this._bonusAccuracity += value; }
  public set recharge(value: number) { this._bonusRecharge += value; }
  public set tenacity(value: number) { this._bonusTenacity += value; }
  public set vigor(value: number) { this._bonusVigor += value; }
  public set dodge(value: number) { this._bonusDodge += value; }
  public set insight(value: number) { this._bonusInsight += value; }

  //? ----------- Atributos Primários -----------

  public get strength(): number { return this._strength; }
  public set strength(value: number) { this._strength = value; }

  public get constitution(): number { return this._constitution; }
  public set constitution(value: number) { this._constitution = value; }

  public get inteligence(): number { return this._inteligence; }
  public set inteligence(value: number) { this._inteligence = value; }

  public get dexterity(): number { return this._dexterity; }
  public set dexterity(value: number) { this._dexterity = value; }

  public get charisma(): number { return this._charisma; }
  public set charisma(value: number) { this._charisma = value; }

  public get wisdown(): number { return this._wisdown; }
  public set wisdown(value: number) { this._wisdown = value; }

}
