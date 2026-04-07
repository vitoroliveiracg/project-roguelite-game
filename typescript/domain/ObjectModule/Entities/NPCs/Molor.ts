import InteractiveEntity from "./InteractiveEntity";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import Attributes from "../Attributes";
import { RegisterSpawner, type SpawnPayload  } from "../../SpawnRegistry";

@RegisterSpawner('molor')
export default class Molor extends InteractiveEntity {
    constructor(id: number, coordinates: { x: number, y: number }, attributes: Attributes, eventManager: IEventManager) {
        super(id, coordinates, attributes, eventManager, 'molor');
    }

    public static override createSpawn(id: number, payload: SpawnPayload, eventManager: IEventManager): Molor {
        // Como Diretor da Academia de Magia, Molor possui Inteligência e Sabedoria colossais!
        const molorStats = payload.attributes || new Attributes(6, 50, 8, 12, 10, 99, 99, 85);
        return new Molor(id, payload.coordinates, molorStats, eventManager);
    }
}