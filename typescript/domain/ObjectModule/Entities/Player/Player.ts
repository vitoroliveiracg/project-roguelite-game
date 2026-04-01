//* import type World from "../../../World";
import Vector2D from "../../../shared/Vector2D";
import Entity from "../Entity";
import Attributes from "../Attributes";
import type IXPTable from "../IXPTable";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import { SimpleBullet } from "../bullets/SimpleBullet";
import type ObjectElement from "../../ObjectElement";
import Enemy from "../Enemies/Enemy";
import Attack from "../../Items/Attack";
import type Item from "../../Items/Item";
import type Weapon from "../../Items/Weapons/Weapon";
import { type DamageInfo } from "../Entity";
import Class from "./Classes/Class";
import type { baseAttributes } from "../Attributes";

export type playerStates = 'idle' | 'walking'

/** Tabela de XP padrão para o jogador, usada antes da implementação do sistema de classes. */
const defaultXpTable: IXPTable = {
  fixedBase: 100,
  levelScale: 1.2,
};

export default class Player extends Entity {

  private movementSinceLastUpdate: boolean = false;
  private isDashing: boolean = false;
  private shooted:boolean = false;

  // --- Sistema de Classes e Skills ---
  private _unlockedClasses: Set<string> = new Set();
  private _activeClass: string | null = null;
  private _classes: Class[] = [];
  private _unlockedSkills: Set<string> = new Set();
  // -----------------------------------

  public backpack: Item[] = [];
  public equipment: { mainHand?: Weapon | undefined } = {};

  constructor (
    id: number,
    coordinates : { x: number, y :number },
    attributes :Attributes,
    eventManager: IEventManager,
    state: playerStates = 'idle'
  ){
    const size = { width: 16, height: 16 }; //? jogador (16x16)
    super(id, coordinates, size, 'player', attributes, eventManager, state);

    // Instancia as classes diretamente no domínio, servindo como o banco de dados das "regras"
    this._classes = [
      new Class('Guerreiro', defaultXpTable, []),
      new Class('Mago', defaultXpTable, [
          { id: 'm_t1_fireball', name: 'Axioma Inicial', type: 'active', tier: 1 },
          { id: 'm_t2_burn', name: 'Sobrecarga de Mana', type: 'passive', tier: 2, requiredSkillId: 'm_t1_fireball' },
          { id: 'm_t2_rare', name: 'Conhecimento Profundo', type: 'rare', tier: 2, requiredSkillId: 'm_t1_fireball' },
      ]),
      new Class('Gunslinger', defaultXpTable, []),
    ];

    this.hitboxes = [ ...this.setHitboxes() ];
  }

  private setHitboxes () :HitBoxCircle[]{

    return [new HitBoxCircle(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
      0,
      7,
      (otherElement: ObjectElement) => {
        if (otherElement instanceof Enemy){
          const enemyAttack = otherElement.onStrike();
          
          if (enemyAttack) {
            const directionToPlayer = new Vector2D(this.coordinates.x - otherElement.coordinates.x, this.coordinates.y - otherElement.coordinates.y).normalize();
            enemyAttack.execute(this, directionToPlayer);
          }
        }
      }
    )]
  }

  public equipItem(backpackIndex: number) {
    const item = this.backpack[backpackIndex];
    if (!item) return;

    if (item.category === 'weapon') {
      const weapon = item as Weapon;
      
      if (this.equipment.mainHand) {
        this.backpack.push(this.equipment.mainHand); // Guarda a antiga
      }
      
      this.equipment.mainHand = weapon; // Equipa a nova
      this.backpack.splice(backpackIndex, 1); // Tira da mochila

      this.eventManager.dispatch('log', { channel: 'domain', message: `Equipped ${weapon.name}`, params: [] });

      if (weapon.unlocksClass) {
        this.unlockClass(weapon.unlocksClass);
        this.setActiveClass(weapon.unlocksClass);
      }
    }
  }

  public unequipItem(slot: string) {
    if (slot === 'mainHand' && this.equipment.mainHand) {
      this.backpack.push(this.equipment.mainHand); // Guarda a arma antiga
      this.equipment.mainHand = undefined;
      this.eventManager.dispatch('log', { channel: 'domain', message: `Unequipped mainHand`, params: [] });
    }
  }

  /** Avança o estado interno do jogador. Chamado a cada frame pelo DomainFacade. */
  public update(deltaTime: number): void {
    if (this.state === 'dead' || this.attributes.hp <= 0) {
      this.state = 'dead';
      return;
    }

    this.move(deltaTime)
    if (!this.movementSinceLastUpdate)  this.state = 'idle';
    
    this.movementSinceLastUpdate = false;
    
    this.direction.reset()
  }

  /**
   * Sobrescreve o método takeDamage para adicionar uma lógica específica do jogador:
   * disparar o evento 'playerDied' quando sua vida chega a zero.
   */
  public override takeDamage(damageInfo: DamageInfo): number {
    const damageDealt = super.takeDamage(damageInfo);

    if (this.attributes.hp <= 0) {
      this.eventManager.dispatch('playerDied', {});
    }

    return damageDealt;
  }

  protected override updatePosition() {
    this.coordinates.x += this.velocity.x;
    this.coordinates.y += this.velocity.y;

    this.hitboxes?.forEach(hb => hb.update(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }, this.rotation
    ));

    this.eventManager.dispatch("playerMoved", { x: this.coordinates.x, y: this.coordinates.y })
    this.eventManager.dispatch('log', { channel: 'domain', message: "(Entity) player moved", params: [] });
  }

  //? ----------- Main actions -----------


  private dashToDirection( direction:Vector2D ):void {
  
    if (!this.isDashing){

      this.accelator.add(direction.normalize()).multiply(3)
      this.isDashing = true
      
      setTimeout(() => {
          this.accelator.reset()
      }, 150);
      
      setTimeout(() => {
          this.isDashing = false
      }, 1000);
    }
  }

  private shootBullet( direction: Vector2D ) {
    if (this.state === 'dead' || this.attributes.hp <= 0) return;

    if(!this.shooted){
      
      if (!this.equipment.mainHand) {
        this.eventManager.dispatch('log', { channel: 'domain', message: "Cannot shoot without a weapon", params: [] });
        return;
      }

      this.shooted = true

      const weapon = this.equipment.mainHand;
      const baseDamage = weapon.baseDamage + Math.floor(this.attributes.strength / 2);

      const playerAttack = new Attack(
        this,
        baseDamage,
        'physical'
      );

      this.eventManager.dispatch('spawn', {
        factory: (id) => new SimpleBullet(id, {...this.coordinates}, direction.normalize(), playerAttack, this.eventManager)
      });

      setTimeout(() => {
        this.shooted = false
      }, 100);
    }
  }

  public override move( deltaTime: number): void {
    if (this.state === 'dead' || this.attributes.hp <= 0) return;

    this.state = 'walking';
    this.movementSinceLastUpdate = true;
    const displacement = this.attributes.speed * deltaTime

    this.velocity = this.direction
      .normalize()
      .multiply(displacement)
      .add(this.accelator);
    
    this.updatePosition();
  }

  //? ----------- On Input Handlers -----------

  public onUpAction (): void {
    this.direction.y -= 1
  }
  public onDownAction (): void {
    this.direction.y += 1
  }
  public onLeftAction (): void {
    this.direction.x -= 1
  }
  public onRightAction (): void {
    this.direction.x += 1
  }
  
  public onShiftAction (): void {
    this.dashToDirection(this.direction)
  }

  public onLeftClickAction( mouseLastCoordinates: {x:number;y:number} ): void {
    const direction = new Vector2D(
        mouseLastCoordinates.x - this.coordinates.x,
        mouseLastCoordinates.y - this.coordinates.y
      )
    this.shootBullet(direction)
  }

  public onRightClickAction( mouseLastCoordinates: {x:number;y:number} ): void {
    const direction = new Vector2D(
      mouseLastCoordinates.x - this.coordinates.x,
      mouseLastCoordinates.y - this.coordinates.y
    )
    
    this.dashToDirection(direction)
  }

  //? ----------- Helpers -----------

  /**
   * Adiciona experiência ao jogador.
   * @param xpAmount A quantidade de experiência a ser adicionada.
   */
  public gainXp(xpAmount: number): void {
    this.attributes.addXp(xpAmount, defaultXpTable);
  }
  /** Retorna o estado atual do jogador. */
  public getState(): 'idle' | 'walking' {
    return this.state;
  }

  public allocateAttribute(attribute: keyof baseAttributes) {
    if(this.attributes.spendPoint(attribute)) {
      this.eventManager.dispatch('log', { channel: 'domain', message: `Allocated point to ${attribute}`, params: [] });
    }
  }

  //? ----------- Class & Skill Management -----------

  /** Desbloqueia permanentemente uma nova classe. Pode ser chamado quando pegar uma arma pela primeira vez. */
  public unlockClass(className: string): void {
    this._unlockedClasses.add(className);
    this.eventManager.dispatch('log', { channel: 'domain', message: `Class unlocked: ${className}`, params: [] });
  }

  /** Define a classe ativa atual. */
  public setActiveClass(className: string): void {
    if (this._unlockedClasses.has(className)) {
      this._activeClass = className;
      this.eventManager.dispatch('log', { channel: 'domain', message: `Class changed to: ${className}`, params: [] });
    }
  }

  public get classes(): Class[] { return this._classes; }
  public get unlockedSkills(): Set<string> { return this._unlockedSkills; }
  
  public unlockSkill(skillId: string): void {
    // Opcional: A regra de negócio se o jogador tem pontos de skill suficientes entra aqui!
    this._unlockedSkills.add(skillId);
    this.eventManager.dispatch('log', { channel: 'domain', message: `Skill unlocked: ${skillId}`, params: [] });
  }

  public get activeClass(): string | null { return this._activeClass; }
  public get unlockedClasses(): string[] { return Array.from(this._unlockedClasses); }
}