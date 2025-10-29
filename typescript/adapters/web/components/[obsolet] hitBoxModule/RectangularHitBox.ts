import { CircleHitBox } from "./CircleHitBox";
import HitBox from "./HitBox";

export class RectangularHitBox extends HitBox {
    private width: number;
    private height: number;

    constructor(posX: number, posY: number, width: number, height: number) {
        super(posX, posY);
        this.width = width;
        this.height = height;
    }

    public getWidth(): number { return this.width; }
    public getHeight(): number { return this.height; }

    isTouching(otherHitBox: HitBox|undefined): boolean {
        if (!otherHitBox) return false 
        const thisCenter = this.getCenter();
        const thisHalfW = this.width / 2;
        const thisHalfH = this.height / 2;
        
        if (otherHitBox instanceof RectangularHitBox) {
            const otherRect = otherHitBox as RectangularHitBox;
            const otherCenter = otherRect.getCenter();
            const otherHalfW = otherRect.getWidth() / 2;
            const otherHalfH = otherRect.getHeight() / 2;

            const noOverlapX = Math.abs(thisCenter.posX - otherCenter.posX) > (thisHalfW + otherHalfW);
            const noOverlapY = Math.abs(thisCenter.posY - otherCenter.posY) > (thisHalfH + otherHalfH);

            return !(noOverlapX || noOverlapY);
        }
        
        if (otherHitBox instanceof CircleHitBox) {
            return otherHitBox.isTouching(this); 
        }

        return false;
    }
}