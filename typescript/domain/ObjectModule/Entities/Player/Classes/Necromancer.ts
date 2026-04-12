import Class from "./Class";
import Skill from "../../../../Skills/Skill";
import type IXPTable from "../../IXPTable";
import type Player from "../Player";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents";

export default class Necromancer extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    constructor(xpTable: IXPTable, player: Player, eventManager: IEventManager) {
        super('Necromante', xpTable, player, eventManager);
        this.skillsByLevel.set(2, new Skill('n_t1_reap', 'Colheita Sombria', 'Golpeia com a foice para arrancar as almas dos inimigos.', 'essential', 1));
        this.skillsByLevel.set(4, new Skill('n_t2_lifesteal', 'Sede de Sangue', 'Seus ataques passam a curar uma porcentagem do seu HP.', 'passive', 2, 'n_t1_reap'));
        this.skillsByLevel.set(6, new Skill('n_t3_soul', 'Ascensão do Lich', 'Abandone sua humanidade. Subclasse com foco em invocação imortal.', 'rare', 3, 'n_t2_lifesteal'));
        this.skillsByLevel.set(8, new Skill('n_t4_corpse_explosion', 'Explosão Sombria', 'Detona almas em uma área para causar dano massivo em corrente.', 'active', 4, 'n_t3_soul'));
    }

    public executeSkill(skillId: string, _mouseCoordinates: {x: number, y: number}): void {
        this.eventManager.dispatch('log', { channel: 'domain', message: `[Necromante] Habilidade ${skillId} ativada via Loadout!`, params: [] });
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}