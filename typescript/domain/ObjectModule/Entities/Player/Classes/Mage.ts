import Class from "./Class";
import Skill from "../../Skills/Skill";
import type IXPTable from "../../IXPTable";

export default class Mage extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    constructor(xpTable: IXPTable) {
        super('Mago', xpTable);
        this.skillsByLevel.set(2, new Skill('m_t1_fireball', 'Axioma Inicial', 'active', 1));
        this.skillsByLevel.set(4, new Skill('m_t2_burn', 'Sobrecarga de Mana', 'passive', 2, 'm_t1_fireball'));
        this.skillsByLevel.set(6, new Skill('m_t2_rare', 'Conhecimento Profundo', 'rare', 3, 'm_t1_fireball'));
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}