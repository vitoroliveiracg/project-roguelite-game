import ObjectElement from "./ObjectElement";
import type { IEventManager } from "../eventDispacher/IGameEvents";
import type { objectTypeId } from "./objectType.type";
import { RegisterSpawner, type SpawnPayload } from "./SpawnRegistry";
import type { HitBox } from "../hitBox/HitBox";

@RegisterSpawner('environmentCollider')
export default class EnvironmentCollider extends ObjectElement {
    constructor(
        id: number,
        coordinates: { x: number; y: number },
        size: { width: number; height: number },
        eventManager: IEventManager,
        hitboxes: HitBox[],
        objectId: objectTypeId = 'environmentCollider'
    ) {
        // Colocamos o estado como 'static'. Ele não terá representação no VisualConfigMap.
        super(size, coordinates, id, objectId, eventManager, 'static', hitboxes);
    }

    public override update(_deltaTime: number): void {
        // Paredes e obstáculos estáticos não se movem, poupando CPU
    }

    public static createSpawn(id: number, payload: SpawnPayload, eventManager: IEventManager): EnvironmentCollider {
        // O tamanho base pode ser 0, pois a hitbox poligonal enviada na carga dita os limites reais
        const size = payload.size || { width: 0, height: 0 };
        const hitboxes = payload.hitboxes || [];
        return new EnvironmentCollider(id, payload.coordinates, size, eventManager, hitboxes);
    }
}