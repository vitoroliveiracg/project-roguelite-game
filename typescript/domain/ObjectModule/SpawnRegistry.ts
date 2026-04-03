import type { IEventManager } from "../eventDispacher/IGameEvents";
import type ObjectElement from "./ObjectElement";

export type SpawnPayload = {
    type: string;
    coordinates: { x: number; y: number; };
    direction?: any;
    attack?: any;
    [key: string]: any;
};

export type SpawnFactory = (id: number, payload: SpawnPayload, eventManager: IEventManager) => ObjectElement;

export class SpawnRegistry {
    public static strategies: Map<string, SpawnFactory> = new Map();
}

export function RegisterSpawner(type: string) {
    return function (constructor: any) {
        SpawnRegistry.strategies.set(type, constructor.createSpawn);
    };
}