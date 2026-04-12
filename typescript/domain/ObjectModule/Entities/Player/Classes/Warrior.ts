import Class from "./Class";
import Skill from "../../../../Skills/Skill";
import type IXPTable from "../../IXPTable";
import type Player from "../Player";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents";

export default class Warrior extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    constructor(xpTable: IXPTable, player: Player, eventManager: IEventManager) {
        super('Guerreiro', xpTable, player, eventManager);
        this.skillsByLevel.set(2, new Skill('w_t1_strike', 'Força Bruta', 'Aumenta significativamente a Constituição da entidade.', 'attribute', 1));
        this.skillsByLevel.set(4, new Skill('w_t2_cleave', 'Corte Giratório', 'Gira a arma varrendo todos os inimigos ao seu redor em um ataque devastador.', 'active', 2, 'w_t1_strike'));
    }

    public executeSkill(skillId: string, _mouseCoordinates: {x: number, y: number}): void {
        this.eventManager.dispatch('log', { channel: 'domain', message: `[Guerreiro] Habilidade ${skillId} executada via Loadout!`, params: [] });
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}