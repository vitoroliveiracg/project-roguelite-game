import Class from "./Class";
import Skill from "../../Skills/Skill";
import type IXPTable from "../../IXPTable";

export default class Necromancer extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    constructor(xpTable: IXPTable) {
        super('Necromante', xpTable);
        this.skillsByLevel.set(2, new Skill('n_t1_reap', 'Colheita Sombria', 'active', 1));
        this.skillsByLevel.set(4, new Skill('n_t2_lifesteal', 'Sede de Sangue', 'passive', 2, 'n_t1_reap'));
        this.skillsByLevel.set(6, new Skill('n_t3_soul', 'Forma Lich', 'rare', 3, 'n_t2_lifesteal'));
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}