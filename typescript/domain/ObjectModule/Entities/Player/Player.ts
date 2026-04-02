//* import type World from "../../../World";
import Vector2D from "../../../shared/Vector2D";
import Entity from "../Entity";
import Attributes from "../Attributes";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import type ObjectElement from "../../ObjectElement";
import Attack from "../../Items/Attack";
import type Item from "../../Items/Item";
import type Weapon from "../../Items/Weapons/Weapon";
import { type DamageInfo } from "../Entity";
import Class from "./Classes/Class";
import type { baseAttributes } from "../Attributes";
import DefaultXPTable from "../DefaultXPTable";
import Warrior from "./Classes/Warrior";
import Mage from "./Classes/Mage";
import Gunslinger from "./Classes/Gunslinger";
import Necromancer from "./Classes/Necromancer";

export type playerStates = 'idle' | 'walking' | 'dead'

const defaultXpTable = new DefaultXPTable();

export class PlayerInventory {
  public backpack: Item[] = [];
  public equipment: { mainHand?: Weapon | undefined } = {};

  constructor(private player: Player, private eventManager: IEventManager) {}

  public equipItem(backpackIndex: number) {
    const item = this.backpack[backpackIndex];
    if (!item) return;

    if (item.category === 'weapon') {
      const weapon = item as Weapon;
      if (this.equipment.mainHand) {
        this.backpack.push(this.equipment.mainHand);
      }
      this.equipment.mainHand = weapon;
      this.backpack.splice(backpackIndex, 1);
      this.eventManager.dispatch('log', { channel: 'domain', message: `Equipped ${weapon.name}`, params: [] });

      if (weapon.unlocksClass) {
        this.player.unlockClass(weapon.unlocksClass);
        this.player.setActiveClass(weapon.unlocksClass);
      }
    }
  }

  public unequipItem(slot: string) {
    if (slot === 'mainHand' && this.equipment.mainHand) {
      this.backpack.push(this.equipment.mainHand);
      this.equipment.mainHand = undefined;
      this.eventManager.dispatch('log', { channel: 'domain', message: `Unequipped mainHand`, params: [] });
    }
  }
}

export class PlayerCombat {
  private shooted: boolean = false;

  constructor(private player: Player, private eventManager: IEventManager) {}

  public shootBullet(direction: Vector2D) {
    if (this.player.state === 'dead' || this.player.attributes.hp <= 0) return;
    if (!this.shooted) {
      if (!this.player.inventory.equipment.mainHand) {
        this.eventManager.dispatch('log', { channel: 'domain', message: "Cannot shoot without a weapon", params: [] });
        return;
      }
      this.shooted = true;
      const weapon = this.player.inventory.equipment.mainHand;
      const baseDamage = weapon.baseDamage + Math.floor(this.player.attributes.strength / 2);
      const playerAttack = new Attack(this.player, baseDamage, 'physical', weapon.onHitActions);
      const projType = weapon.projectileType || 'simpleBullet';
      this.eventManager.dispatch('spawn', {
        type: projType,
        coordinates: { ...this.player.coordinates },
        direction: direction.clone().normalizeMut(),
        attack: playerAttack
      });
      setTimeout(() => { this.shooted = false }, 100);
    }
  }

  public castSpell(spellBuffer: string[], direction: Vector2D): boolean {
    if (this.player.state === 'dead' || this.player.attributes.hp <= 0) return false;
    
    const sequence = spellBuffer.join(',');
    
    // Projectile (0) + Fire (4) + Projectile (0) = Fireball
    if (sequence === 'spell_0,spell_4,spell_0') {
      const baseDamage = 30 + Math.floor(this.player.attributes.intelligence * 2);
      const playerAttack = new Attack(this.player, baseDamage, 'magical', []);
      this.eventManager.dispatch('spawn', {
        type: 'fireball',
        coordinates: { ...this.player.coordinates },
        direction: direction.clone().normalizeMut(),
        attack: playerAttack
      });
      this.eventManager.dispatch('log', { channel: 'domain', message: `Cast spell: Fireball!`, params: [] });
      return true;
    } else if (sequence === 'spell_0,spell_5') {
      // Water Missile
      const baseDamage = 15 + Math.floor(this.player.attributes.intelligence);
      const playerAttack = new Attack(this.player, baseDamage, 'magical', []);
      this.eventManager.dispatch('spawn', {
        type: 'magicMissile',
        coordinates: { ...this.player.coordinates },
        direction: direction.clone().normalizeMut(),
        attack: playerAttack
      });
      this.eventManager.dispatch('log', { channel: 'domain', message: `Cast spell: Water Missile!`, params: [] });
      return true;
    } else {
      return false; // Sequência ainda não completou uma magia válida
    }
  }
}

export default class Player extends Entity {

  private movementSinceLastUpdate: boolean = false;
  private isDashing: boolean = false;

  // --- Sistema de Classes e Skills ---
  private _unlockedClasses: Set<string> = new Set();
  private _activeClass: string | null = null;
  private _classes: Class[] = [];
  private _unlockedSkills: Set<string> = new Set();
  // -----------------------------------

  public inventory: PlayerInventory;
  public combat: PlayerCombat;
  public facingDirection: Vector2D = new Vector2D(1, 0); // Direção para onde o mago atira

  constructor (
    id: number,
    coordinates : { x: number, y :number },
    attributes :Attributes,
    eventManager: IEventManager,
    state: playerStates = 'idle'
  ){
    const size = { width: 16, height: 16 }; //? jogador (16x16)
    super(id, coordinates, size, 'player', attributes, eventManager, state);

    this.inventory = new PlayerInventory(this, eventManager);
    this.combat = new PlayerCombat(this, eventManager);

    // Instancia as classes diretamente no domínio, servindo como o banco de dados das "regras"
    this._classes = [
      new Warrior(defaultXpTable),
      new Mage(defaultXpTable),
      new Gunslinger(defaultXpTable),
      new Necromancer(defaultXpTable),
    ];

    this.hitboxes = [ ...this.setHitboxes() ];
  }

  private setHitboxes () :HitBoxCircle[]{

    return [new HitBoxCircle(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
      0,
      7,
      (otherElement: ObjectElement) => {
        // Verificação estrita: garante que é uma função antes de chamar
        if (typeof (otherElement as any).onStrike === 'function'){
          const enemyAttack = (otherElement as any).onStrike();
          
          if (enemyAttack) {
            let directionToPlayer = new Vector2D(this.coordinates.x - otherElement.coordinates.x, this.coordinates.y - otherElement.coordinates.y);
            
            // Proteção Anti-NaN: Se estiverem exatamente no mesmo pixel, força uma direção arbitrária
            if (directionToPlayer.x === 0 && directionToPlayer.y === 0) {
              directionToPlayer.x = 1;
            }
            
            directionToPlayer.normalizeMut();
            enemyAttack.execute(this, directionToPlayer);
          }
        }
      }
    )]
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
    
    this.direction.resetMut()
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

    this.eventManager.dispatch('log', { channel: 'domain', message: "(Entity) player moved", params: [] });
  }

  //? ----------- Main actions -----------


  private dashToDirection( direction:Vector2D ):void {
  
    if (!this.isDashing){

      this.accelerator.addMut(direction.clone().normalizeMut()).multiplyMut(3)
      this.isDashing = true
      
      setTimeout(() => {
          this.accelerator.resetMut()
      }, 150);
      
      setTimeout(() => {
          this.isDashing = false
      }, 1000);
    }
  }

  public override move( deltaTime: number): void {
    if (this.state === 'dead' || this.attributes.hp <= 0) return;

    this.state = 'walking';
    this.movementSinceLastUpdate = true;
    const displacement = this.attributes.speed * deltaTime
    
    // Guarda a última direção virada para usar na magia
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      this.facingDirection = this.direction.clone().normalizeMut();
    }

    this.velocity = this.direction.clone()
      .normalizeMut()
      .multiplyMut(displacement)
      .addMut(this.accelerator);
    
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

  public castSpell(spellBuffer: string[]): boolean {
    if (this.activeClass !== 'Mago') {
        return false;
    }
    return this.combat.castSpell(spellBuffer, this.facingDirection.clone());
  }

  public onLeftClickAction( mouseLastCoordinates: {x:number;y:number} ): void {
    if (this.activeClass === 'Mago') return; // Mago não atira com o mouse!

    const direction = new Vector2D(
        mouseLastCoordinates.x - this.coordinates.x,
        mouseLastCoordinates.y - this.coordinates.y
      )
    this.combat.shootBullet(direction)
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
    const oldLevel = this.attributes.level;
    const activeClass = this._classes.find(c => c.name === this._activeClass);
    const xpTable = activeClass ? activeClass.xpTable : defaultXpTable;
    
    this.attributes.addXp(xpAmount, xpTable);
    const newLevel = this.attributes.level;

    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
        this.processLevelUp(lvl);
    }
  }

  private processLevelUp(level: number): void {
      this.eventManager.dispatch('levelUp', { newLevel: level });
      this.eventManager.dispatch('log', { channel: 'domain', message: `Player leveled up to ${level}!`, params: [] });
      
      const activeClass = this._classes.find(c => c.name === this._activeClass);
      const xpTable = activeClass ? activeClass.xpTable : defaultXpTable;
      const rewards = xpTable.getRewardsForLevel(level);

      for (const reward of rewards) {
          switch (reward) {
              case 'attribute_point':
                  this.attributes.grantAvailablePoint();
                  this.eventManager.dispatch('log', { channel: 'domain', message: `Gained an attribute point!`, params: [] });
                  break;
              case 'class_skill':
                  if (activeClass) {
                      const newSkill = activeClass.getSkillForLevel(level);
                      if (newSkill) {
                          // Sistema instancia a classe e, de acordo com o nível, destrava a skill automaticamente
                          this.unlockSkill(newSkill.id);
                          this.eventManager.dispatch('log', { channel: 'domain', message: `Gained class skill: ${newSkill.name}!`, params: [] });
                      }
                  }
                  break;
          }
      }
  }
  /** Retorna o estado atual do jogador. */
  public getState(): 'idle' | 'walking' | 'dead' {
    return this.state as playerStates;
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