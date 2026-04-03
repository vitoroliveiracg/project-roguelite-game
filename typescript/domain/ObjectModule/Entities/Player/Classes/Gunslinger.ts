import Class from "./Class";
import Skill from "../../../../Skills/Skill";
import type IXPTable from "../../IXPTable";
import type Player from "../Player";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents";

export default class Gunslinger extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    constructor(xpTable: IXPTable, player: Player, eventManager: IEventManager) {
        super('Gunslinger', xpTable, player, eventManager);
        // A identidade da classe: Define QUAIS skills são entregues aos ganchos de nível
        this.skillsByLevel.set(2, new Skill('gs_t1_quickdraw', 'Saque Rápido', 'passive', 1));
        this.skillsByLevel.set(4, new Skill('gs_t2_fanhammer', 'Fan the Hammer', 'active', 2, 'gs_t1_quickdraw'));
        this.skillsByLevel.set(6, new Skill('gs_t3_deadeye', 'Olhos de Águia', 'passive', 3, 'gs_t2_fanhammer'));
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}