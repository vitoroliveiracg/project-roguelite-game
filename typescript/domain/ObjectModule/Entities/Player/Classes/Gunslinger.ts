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
        this.skillsByLevel.set(2, new Skill('gs_t1_quickdraw', 'Saque Rápido', 'Reduz drasticamente o cooldown do tiro principal.', 'essential', 1));
        this.skillsByLevel.set(4, new Skill('gs_t2_fanhammer', 'Fan the Hammer', 'Descarrega o tambor da arma causando dano explosivo em área.', 'active', 2, 'gs_t1_quickdraw'));
        this.skillsByLevel.set(6, new Skill('gs_t3_deadeye', 'Caminho do Franco-Atirador', 'Especialize-se na Subclasse Franco-Atirador para dano crítico avassalador.', 'rare', 3, 'gs_t2_fanhammer'));
    }

    public executeSkill(skillId: string, mouseCoordinates: {x: number, y: number}): void {
        if (skillId === 'gs_t2_fanhammer') {
            this.eventManager.dispatch('log', { channel: 'domain', message: `[Gunslinger] Fan the Hammer ativado no alvo: ${Math.floor(mouseCoordinates.x)}, ${Math.floor(mouseCoordinates.y)}`, params: [] });
            // Lógica de instanciar os tiros rápidos será aqui!
        }
    }

    public getSkillForLevel(level: number): Skill | null {
        return this.skillsByLevel.get(level) || null;
    }

    public get allSkills(): Skill[] {
        return Array.from(this.skillsByLevel.values());
    }
}