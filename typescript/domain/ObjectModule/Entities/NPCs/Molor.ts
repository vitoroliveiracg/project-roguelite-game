import { CognitiveNpc } from "./CognitiveNpc";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import Attributes from "../Attributes";
import { RegisterSpawner, type SpawnPayload } from "../../SpawnRegistry";

@RegisterSpawner('molor')
export default class Molor extends CognitiveNpc {
    constructor(id: number, coordinates: { x: number, y: number }, attributes: Attributes, eventManager: IEventManager, llmService?: any) {
        // Molor tem um sprite 32x32 e se registra visualmente como 'molor'
        super(id, coordinates, { width: 32, height: 32 }, 'molor', attributes, eventManager, null, llmService);
        
        this.npcName = "Diretor Molor";
        this.persona = `
        Você é o Diretor Molor, um mago extremamente poderoso, sábio e levemente impaciente da Academia de Magia.
        Você fala de forma eloquente, enigmática e trata o jogador como um "Jovem Axiomante" inexperiente.
        Você adora ensinar e filosofar sobre as energias arcanas, mas odeia que desperdicem seu tempo com bobagens.
        Seja sucinto em suas respostas, mas não perca a grandiosidade. Nunca saia do personagem.
        `;
    }

    public static createSpawn(id: number, payload: SpawnPayload, eventManager: IEventManager): Molor {
        // Como Diretor da Academia de Magia, Molor possui Inteligência e Sabedoria colossais!
        const molorStats = payload.attributes || new Attributes(6, 50, 8, 12, 10, 99, 99, 85);
        // O payload deve injetar o llmService configurado pela fábrica no adaptador
        return new Molor(id, payload.coordinates, molorStats, eventManager, (payload as any).llmService);
    }
}