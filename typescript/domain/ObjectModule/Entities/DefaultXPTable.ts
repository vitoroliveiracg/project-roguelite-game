import type IXPTable from "./IXPTable";
import type { ProgressionReward } from "./IXPTable";

export default class DefaultXPTable implements IXPTable {
    public fixedBase = 100; // Base menor para fisgar o jogador com progressão ultra-rápida no início
    public levelScale = 1.3; // Curva mais gentil para evitar o "grind wall"

    public getRewardsForLevel(level: number): ProgressionReward[] {
        const rewards: ProgressionReward[] = [];
        
        // ESQUEMA DE RAZÃO VARIÁVEL (Jackpot Dopaminérgico)
        // Níveis múltiplos de 5 oferecem um salto massivo de poder (3 atributos!)
        if (level % 5 === 0) rewards.push('attribute_point', 'attribute_point', 'attribute_point');
        else rewards.push('attribute_point'); // Nível normal

        if (level % 2 === 0) { // Nos níveis pares, o jogador tem o direito de ganhar uma habilidade de classe
            rewards.push('class_skill');
        }
        return rewards;
    }
}