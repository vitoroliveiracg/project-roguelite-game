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
    // 1. Verificar se o ataque é crítico
    const isCritical = Math.random() * 100 < this._attacker.attributes.critChance;

    // 2. Calcular o dano total
    let totalDamage = this.baseDamage; // Começa com o dano base
    // Adiciona bônus de atributos (ex: força para dano físico)
    if (this.damageType === 'physical') {
      totalDamage += this._attacker.attributes.strength;
    } else if (this.damageType === 'magical') {
      totalDamage += this._attacker.attributes.inteligence;
    }

    // Aplica o multiplicador de dano crítico, se for o caso
    if (isCritical) {
      totalDamage *= (this._attacker.attributes.critDamage / 100);
    }

    // 3. Aplicar o dano ao alvo. O método `takeDamage` no alvo é quem aplica as defesas e reduz o HP.
    const damageDealt = target.takeDamage({
      totalDamage: Math.floor(totalDamage),
      damageType: this.damageType,
      isCritical: isCritical,
      direction: direction,
      attacker: this._attacker,
    });

    // 4. Executar todas as ações "OnHit"
    const context = { attacker: this._attacker, target, damageDealt };
    this.onHitActions.forEach(action => action(context));
  }
}