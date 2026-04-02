import type { IEventManager } from "../../eventDispacher/IGameEvents";
import { HitBoxCircle } from "../../hitBox/HitBoxCircle";
import type { objectTypeId } from "../objectType.type";
import ObjectElement from "../ObjectElement";
import type Item from "./Item";
import Player from "../Entities/Player/Player";

export default class DroppedItem extends ObjectElement {
    public item: Item;

    constructor(
        id: number,
        coordinates: { x: number; y: number },
        item: Item,
        eventManager: IEventManager,
        objectId: objectTypeId = 'droppedItem'
    ) {
        const size = { width: 16, height: 16 };
        super(size, coordinates, id, objectId, eventManager, item.iconId.toString());
        this.item = item;
        
        this.hitboxes = [
            new HitBoxCircle(
                { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
                0,
                12, // Radius um pouco maior (12px) para facilitar a coleta ao passar perto
                (otherElement: ObjectElement) => {
                    if (otherElement instanceof Player) {
                            otherElement.inventory.backpack.push(this.item);
                        this.eventManager.dispatch('log', { channel: 'domain', message: `Collected item: ${this.item.name}`, params: [] });
                        super.destroy(); // Despawna a cápsula do mapa
                    }
                }
            )
        ];
    }

    public update(deltaTime: number): void { }
}