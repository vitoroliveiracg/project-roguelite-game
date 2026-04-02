import type IXPTable from "./IXPTable";
import type { ProgressionReward } from "./IXPTable";

export default class DefaultXPTable implements IXPTable {
    public fixedBase = 100;
    public levelScale = 1.2;

    public getRewardsForLevel(level: number): ProgressionReward[] {
        const rewards: ProgressionReward[] = ['attribute_point']; // Todo nível concede um ponto de atributo base
        if (level % 2 === 0) { // Nos níveis pares, o jogador tem o direito de ganhar uma habilidade de classe
            rewards.push('class_skill');
        }
        return rewards;
    }
}