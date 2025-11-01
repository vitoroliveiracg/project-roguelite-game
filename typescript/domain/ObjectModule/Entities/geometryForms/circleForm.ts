import { logger } from "../../../../adapters/web/shared/Logger";
import Vector2D from "../../../shared/Vector2D";
import ObjectElement from "../../ObjectElement";
import type { objectTypeId } from "../../objectType.type";

export type circleState = 'normal'

export default class CircleForm extends ObjectElement {
    protected velocity: Vector2D = new Vector2D(0, 0);
    protected direction: Vector2D = new Vector2D(0, 0);
    constructor(
        id: number,
        coordinates: { x: number; y: number; },
        size: { width: number; height: number; },
        state :circleState,
        objectId: objectTypeId = 'circle',
    ){ 
        super(size, coordinates, id, state, objectId) 
    }

    //? ----------- Methods -----------

    public move(deltaTime: number):void {
        //! --debug "colisão do personagem"

        //? Calcula o deslocamento para este frame (velocidade * tempo) e o aplica.
        this.velocity.multiply(deltaTime)

        logger.log("domain", "(Entity) moved");

        this.updatePosition()
    }

    protected updatePosition() {
        super.coordinates.x += this.velocity.x;
        super.coordinates.y += this.velocity.y;

        logger.log("domain", "(Entity) moved");
    }

    /**
     * Avança o estado interno da entidade. Pode ser sobrescrito por subclasses.
     * @param deltaTime O tempo em segundos decorrido desde o último frame.
     */
    public update(deltaTime: number): void {
        this.move(deltaTime)
    }


}