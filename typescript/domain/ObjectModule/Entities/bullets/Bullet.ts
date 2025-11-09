import Vector2D from "../../../shared/Vector2D";
import ObjectElement from "../../ObjectElement";
import { gameEvents } from "../../../eventDispacher/eventDispacher";
import type { objectTypeId } from "../../objectType.type";

export type bulletStates = 'travelling' | 'stopped' | 'lounched'

export default abstract class Bullet extends ObjectElement {
    protected velocity: Vector2D = new Vector2D(0, 0);
    public direction: Vector2D = new Vector2D(0, 0);

    constructor(
        id: number,
        coordinates: { x: number; y: number; },
        size: { width: number; height: number; },
        objectId: objectTypeId,
        state :bulletStates,
    ){ 
        super(size, coordinates, id, state, objectId) 
    }

    //? ----------- Methods -----------

    public move(deltaTime: number):void {
        //! --debug "colisão do personagem"

        //? Calcula o deslocamento para este frame (velocidade * tempo) e o aplica.
        this.velocity.multiply(deltaTime)

        gameEvents.dispatch('log', { channel: 'domain', message: `(Bullet) ${this.id}-${this.objectId} moved`, params: [] });

        this.updatePosition()
    }

    protected updatePosition() {
        super.coordinates.x += this.velocity.x;
        super.coordinates.y += this.velocity.y;
    }

    /**
     * Avança o estado interno da entidade. Pode ser sobrescrito por subclasses.
     * @param deltaTime O tempo em segundos decorrido desde o último frame.
     */
    public abstract update(deltaTime: number): void
}