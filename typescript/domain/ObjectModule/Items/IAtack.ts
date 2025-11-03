import type Vector2D from "../../shared/Vector2D";
import type Entity from "../Entities/Entity";

export type DamageType = 'physical' | 'magical' | 'true';

/** * Define o contexto disponível quando uma ação "OnHit" é executada. * Isso permite que efeitos complexos (como roubo de vida) tenham acesso * a todas as informações relevantes do evento de ataque. */
export interface AttackContext {
    attacker: Entity;
    target: Entity;
    damageDealt: number;
}

/** * Define o contrato para uma ação que ocorre no momento do impacto. * É a base para criar efeitos como roubo de vida, aplicar veneno, etc. */
export type OnHitAction = (context: AttackContext) => void;

/** * Define o contrato para um objeto de ataque. * Sua principal responsabilidade é executar o ataque contra um alvo. */
export interface IAtack {
    execute(target: Entity, direction: Vector2D): void;
}