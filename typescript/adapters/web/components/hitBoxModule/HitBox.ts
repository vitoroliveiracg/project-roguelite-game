import type Point from "../../shared/Point";

export default abstract class HitBox {
    protected center: Point

    constructor( posX: number, posY: number ) {
        this.center = { posX, posY }
    }

    abstract isTouching(otherHitBox: HitBox|undefined): boolean;

    public getCenter(): Point {
        return { ...this.center }
    }
}