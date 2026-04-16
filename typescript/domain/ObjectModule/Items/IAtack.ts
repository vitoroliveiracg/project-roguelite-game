import type Vector2D from "../../shared/Vector2D";
import type Entity from "../Entities/Entity";

export type DamageType = 'physical' | 'magical' | 'true' | 'fire' | 'water' | 'nature' | 'thunder' | 'light' | 'magic' | 'ground' | 'dark';

/** * Define o contrato para uma ação que ocorre no momento do impacto. * Evita alocação de objetos de contexto (Zero-GC). */
export type OnHitAction = (attacker: Entity, target: Entity, damageDealt: number) => void;

/** * Define o contrato para um objeto de ataque. * Sua principal responsabilidade é executar o ataque contra um alvo. */
export interface IAtack {
    execute(target: Entity, direction: Vector2D): void;
}