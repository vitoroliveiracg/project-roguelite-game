import Projectile, { type projectileStates } from "./Projectile";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type { objectTypeId } from "../../objectType.type";

export type bulletStates = projectileStates;

export default abstract class Bullet extends Projectile {
    constructor(
        id: number,
        coordinates: { x: number; y: number; },
        size: { width: number; height: number; },
        objectId: objectTypeId,
        eventManager: IEventManager,
        state: bulletStates = 'travelling',
    ){ 
        super(id, coordinates, size, objectId, eventManager, state);
    }
}