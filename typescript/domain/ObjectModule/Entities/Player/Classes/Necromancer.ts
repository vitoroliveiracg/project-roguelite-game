import Class from "./Class";
import Skill from "../../../../Skills/Skill";
import type IXPTable from "../../IXPTable";
import type Player from "../Player";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents";

export default class Necromancer extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    constructor(xpTable: IXPTable, player: Player, eventManager: IEventManager) {
        super('Necromante', xpTable, player, eventManager);
        this.skillsByLevel.set(2, new Skill('n_t1_reap', 'Colheita Sombria', 'active', 1));
        this.skillsByLevel.set(4, new Skill('n_t2_lifesteal', 'Sede de Sangue', 'passive', 2, 'n_t1_reap'));
        this.skillsByLevel.set(6, new Skill('n_t3_soul', 'Forma Lich', 'active', 3, 'n_t2_lifesteal'));
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}