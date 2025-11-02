import type Vector2D from "../../shared/Vector2D";

export type damageType = 'phisical' | 'magical'

//! Passar um callback para calcular dano? (dano relativo a vida)
/** Loads generic infos for atacks */
export interface IAtack {
    atackerId: number,
    direction: Vector2D
    totalDamage: number
    damageType: damageType
    isCritical: boolean
}