import HitBox from "./HitBox";
import { RectangularHitBox } from "./RectangularHitBox";

export class CircleHitBox extends HitBox {
    private radius: number;

    constructor(posX: number, posY: number, radius: number) {
        super(posX, posY);
        this.radius = radius;
    }

    public getRadius(): number { return this.radius; }

    isTouching(otherHitBox: HitBox|undefined): boolean {
        if (!otherHitBox) return false
        const thisCenter = this.getCenter();
        
        if (otherHitBox instanceof CircleHitBox) {
            const otherCircle = otherHitBox as CircleHitBox;
            const otherCenter = otherCircle.getCenter();
            
            const dx = thisCenter.posX - otherCenter.posX;
            const dy = thisCenter.posY - otherCenter.posY;
            const distanceSquared = (dx * dx) + (dy * dy);
            
            const sumOfRadii = this.radius + otherCircle.getRadius();
            const sumOfRadiiSquared = sumOfRadii * sumOfRadii;
            
            return distanceSquared <= sumOfRadiiSquared;
        }
        
        if (otherHitBox instanceof RectangularHitBox) {
            const otherRect = otherHitBox as RectangularHitBox;
            const otherCenter = otherRect.getCenter();
            const otherHalfW = otherRect.getWidth() / 2;
            const otherHalfH = otherRect.getHeight() / 2;
            
            const closestX = Math.max(otherCenter.posX - otherHalfW, Math.min(thisCenter.posX, otherCenter.posX + otherHalfW));
            const closestY = Math.max(otherCenter.posY - otherHalfH, Math.min(thisCenter.posY, otherCenter.posY + otherHalfH));

            const dx = thisCenter.posX - closestX;
            const dy = thisCenter.posY - closestY;
            
            const distanceSquared = (dx * dx) + (dy * dy);

            return distanceSquared <= (this.radius * this.radius);
        }

        return false;
    }
}