import ObjectElement from "../ObjectElement";
import Vector2D from "../../shared/Vector2D";

import type { objectTypeId } from "../objectType.type";
import type Attributes from "./Attributes";
import type { HitBox } from "../../hitBox/HitBox";
import type { DamageType } from "../Items/IAtack";;
import type { IEventManager } from "../../eventDispacher/IGameEvents";
import type StatusEffect from "./Status/StatusEffect";
import RewardGenerator from "../Items/RewardGenerator";

export interface DamageInfo {
  totalDamage: number;
  damageType: DamageType;
  isCritical: boolean;
  direction: Vector2D;
  attacker: Entity;
}

export default abstract class Entity extends ObjectElement {
  public velocity: Vector2D = new Vector2D(0, 0);
  public direction: Vector2D = new Vector2D(0, 0);
  public hitBox :HitBox[] | null = null
  public activeStatuses: Map<string, StatusEffect> = new Map();

  constructor(
    id: number,
    coordinates: { x: number; y: number; },
    size: { width: number; height: number; },
    objectId: objectTypeId,
    public attributes :Attributes,
    eventManager: IEventManager,
    state :string = "",
    protected accelerator:Vector2D = new Vector2D(0,0),
    protected hurtLaunchFactor:number = 10
  ){ 
    super(size, coordinates, id, objectId, eventManager, state) 
  }

  //? ----------- Methods -----------

  /** Avança o estado interno da entidade. Pode ser sobrescrito por subclasses. * @param deltaTime O tempo em segundos decorrido desde o último frame. * @param player Instância do jogador, se necessária para cálculo de IA. */
  public abstract override update(deltaTime: number, player?: any): void;
  
  public applyStatus(status: StatusEffect): void {
    const existing = this.activeStatuses.get(status.id);
    if (existing) {
        existing.duration = Math.max(existing.duration, status.duration); // Renova a duração
        existing.elapsed = 0;
    } else {
        this.activeStatuses.set(status.id, status);
        status.apply(this);
        (this as any).eventManager?.dispatch('log', { channel: 'domain', message: `Status ${status.id} aplicado em ${this.objectId}`, params: [] });
    }
  }

  public updateStatuses(deltaTime: number): void {
    for (const [id, status] of this.activeStatuses.entries()) {
        if (status.update(deltaTime, this)) {
            this.activeStatuses.delete(id);
            (this as any).eventManager?.dispatch('log', { channel: 'domain', message: `Status ${id} removido de ${this.objectId}`, params: [] });
        }
    }
  }

  protected updatePosition() {
    this.coordinates.x += this.velocity.x;
    this.coordinates.y += this.velocity.y;
    
    this.eventManager.dispatch('log', { channel: 'domain', message: `(Entity) ${this.id}-${this.objectId} moved`, params: [] });
  }

  /** Aplica dano à entidade e retorna se ela foi derrotada. * @param damageInfo DTO contendo as informações do dano a ser aplicado - objeto simplificado do ataque. * @returns O dano real causado após a aplicação das defesas. */
  public takeDamage(damageInfo: DamageInfo): number {

    let finalDamage = damageInfo.totalDamage;

    // VULNERABILIDADES ELEMENTAIS (A Sinergia)
    if (this.activeStatuses.has('wet')) {
        if (damageInfo.damageType === 'thunder') finalDamage *= 1.5; // Água conduz eletricidade
        if (damageInfo.damageType === 'fire') finalDamage *= 0.5;    // Água apaga fogo
    }
    // DEBUFF DE VENENO
    if (this.activeStatuses.has('poison')) {
        finalDamage *= 1.15; // 15% a mais de dano recebido de todas as fontes
    }
    // DANO SAGRADO VS MORTOS-VIVOS
    if (damageInfo.damageType === 'light' && ['skeleton', 'zombie', 'vampire', 'lich', 'demon', 'bdiAgent'].includes(this.objectId)) {
        finalDamage *= 2.0;
    }

    if (damageInfo.damageType !== 'true') {
      finalDamage = Math.max(1, damageInfo.totalDamage - this.attributes.defence);
    }

    // Aplica o dano ao HP
    this.attributes.hp -= finalDamage;
    
    const centerX = this.coordinates.x + this.size.width / 2;
    const centerY = this.coordinates.y + this.size.height / 2;

    if (this.attributes.hp <= 0) {
      this.state = 'dead';
      
      // GERAÇÃO DE SAQUE (LOOT): Drasticamente reduzido (apenas 15% de chance de rolar um drop!)
      if (this.objectId !== 'player' && this.objectId !== 'bdiAgent' && Math.random() < 0.15) {
         RewardGenerator.generateDrop({ x: centerX, y: centerY }, this.eventManager);
      }

      // A CATARSE: Limpeza cognitiva. Overkill vs Morte Comum
      if (damageInfo.totalDamage >= this.attributes.maxHp * 1.5) {
         this.eventManager.dispatch('particle', { effect: 'overkillShatter', x: centerX, y: centerY });
      } else {
         this.eventManager.dispatch('particle', { effect: 'enemyDeath', x: centerX, y: centerY });
      }
      
      super.destroy()
      return finalDamage;
    }

    // O "ESTALO" E A RESPOSTA TÁTIL: Acertos Críticos e Dano Físico
    if (damageInfo.isCritical) {
      this.eventManager.dispatch('particle', { effect: 'criticalStrike', x: centerX, y: centerY });
    } else if (damageInfo.damageType === 'physical') {
      this.eventManager.dispatch('particle', { effect: 'bloodSplatter', x: centerX, y: centerY });
    }

    // Calcula a força do knockback com base no fator de lançamento, não mais na vida do alvo.
    const safeDirection = damageInfo.direction instanceof Vector2D ? damageInfo.direction : new Vector2D((damageInfo.direction as any).x || 0, (damageInfo.direction as any).y || 0);
    const acceleratorVectorInfluency = safeDirection.clone().multiplyMut(this.hurtLaunchFactor);
    this.accelerator.addMut(acceleratorVectorInfluency)

    setTimeout(() => {
      this.accelerator.resetMut()
    }, 100);

    return finalDamage;
  }

  public resetAccelerator(): void {
    this.accelerator.resetMut();
  }


  public move(deltaTime: number):void {
    if (this.activeStatuses.has('stun') || this.activeStatuses.has('paralyze')) return; // Controle de Grupo! (Não sai do lugar)
    //? Calcula o deslocamento para este frame (velocidade * tempo) e o aplica.
    this.velocity.multiplyMut(deltaTime)
    
    this.updatePosition()
  }

  protected disperseFrom(otherElement: ObjectElement) {
    const dX = (this.coordinates.x + this.size.width / 2) - (otherElement.coordinates.x + otherElement.size.width / 2);
    const dY = (this.coordinates.y + this.size.height / 2) - (otherElement.coordinates.y + otherElement.size.height / 2);

    const disperseVector = new Vector2D(dX,dY).normalizeMut()
    this.velocity = disperseVector.clone().addMut(this.accelerator);

    this.updatePosition();
  }
  /** * Calcula a distância euclidiana do centro desta entidade até o centro de outro elemento. * @param otherElement O outro elemento para o qual a distância será medida. * @returns A distância como um número. */
  public getDistanceTo(otherElement: ObjectElement): number {
    const dx = (this.coordinates.x + this.size.width / 2) - (otherElement.coordinates.x + otherElement.size.width / 2);
    const dy = (this.coordinates.y + this.size.height / 2) - (otherElement.coordinates.y + otherElement.size.height / 2);
    // Usa o Teorema de Pitágoras para encontrar a distância
    return Math.sqrt(dx * dx + dy * dy);
  }

}