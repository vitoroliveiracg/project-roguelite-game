import Class from "./Class";
import Skill from "../../Skills/Skill";
import type IXPTable from "../../IXPTable";

export default class Warrior extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    constructor(xpTable: IXPTable) {
        super('Guerreiro', xpTable);
        this.skillsByLevel.set(2, new Skill('w_t1_strike', 'Golpe Pesado', 'active', 1));
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}