import type Entity from "../Entities/Entity";
import type Vector2D from "../../shared/Vector2D";
import type { DamageType, IAtack, OnHitAction } from "./IAtack";

/**
 * Representa uma instância de um ataque, encapsulando toda a sua lógica.
 * Esta classe é responsável por calcular o dano, verificar acertos críticos,
 * aplicar o dano ao alvo e executar quaisquer efeitos "OnHit".
 */
export default class Attack implements IAtack {

  /**
   * @param _attacker A entidade que está realizando o ataque.
   * @param baseDamage O dano base da arma ou habilidade.
   * @param damageType O tipo de dano (físico, mágico, etc.).
   * @param onHitActions Uma lista de callbacks a serem executados no impacto.
   */
  constructor(
    private _attacker: Entity,
    private baseDamage: number,
    private damageType: DamageType,
    private onHitActions: OnHitAction[] = []
  ) {}

  public get attacker(): Entity { return this._attacker; }

  /**
   * Orquestra a execução completa do ataque contra um alvo.
   * @param target A entidade que está recebendo o ataque.
   * @param direction O vetor de direção do ataque, para knockback.
   */
  public execute(target: Entity, direction: Vector2D): void {

    const isCritical = Math.random() * 100 < this._attacker.attributes.critChance;

    let totalDamage = this.baseDamage; // Começa com o dano base

    if (this.damageType === 'physical') {
      totalDamage += this._attacker.attributes.strength * 0.5; // Escalonamento de dano físico reduzido
    } else if (this.damageType === 'magical') {
      totalDamage += this._attacker.attributes.intelligence * 0.5; // Escalonamento de dano mágico reduzido
    }

    if (isCritical) {
      totalDamage *= (this._attacker.attributes.critDamage / 100);
    }

    const damageDealt = target.takeDamage({
      totalDamage: Math.floor(totalDamage),
      damageType: this.damageType,
      isCritical: isCritical,
      direction: direction,
      attacker: this._attacker,
    });

    // Se o alvo foi derrotado e o atacante é o jogador, concede o XP.
    if (target.attributes.hp <= 0 && this._attacker.objectId === 'player') {
      if ('xpGiven' in target) {
        (this._attacker as any).gainXp((target as any).xpGiven);
      }
    }

    // Vampirismo (Lifesteal) - Cura a entidade atacante baseada no dano real causado!
    const lifestealPercent = this._attacker.attributes.lifesteal;
    if (lifestealPercent > 0 && damageDealt > 0) {
      const healAmount = damageDealt * (lifestealPercent / 100);
      this._attacker.attributes.hp += healAmount; // Setter barra cura extra limitando ao maxHp
      
      const attackerAny = this._attacker as any;
      if (attackerAny.eventManager) {
        const cx = this._attacker.coordinates.x + this._attacker.size.width / 2;
        const cy = this._attacker.coordinates.y + this._attacker.size.height / 2;
        attackerAny.eventManager.dispatch('particle', { effect: 'magicAura', x: cx, y: cy, color: '#ff2a2a' }); // Gotículas de sangue voltando
      }
    }

    const context = { attacker: this._attacker, target, damageDealt };
    this.onHitActions.forEach(action => action(context));

    setTimeout(() => {
      this._attacker.resetAccelerator();
    }, 150);
  }
}