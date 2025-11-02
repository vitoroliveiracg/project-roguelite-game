import { gameEvents } from "../../../eventDispacher/eventDispacher";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import Vector2D from "../../../shared/Vector2D";
import type ObjectElement from "../../ObjectElement";
import Bullet, { type bulletStates } from "./Bullet";

export class SimpleBullet extends Bullet {
    public accelator: Vector2D = new Vector2D(0, 0);
    private speed:number = 150
    private distanceTraveled: number = 0
    private static readonly BASE_DAMAGE = 10;

    constructor (
        id: number,
        coordinates: { x: number; y: number; },
        direction: Vector2D,
        state :bulletStates = 'travelling',
        damage: number = SimpleBullet.BASE_DAMAGE
    ){
        const size = { width: 8, height: 8 }; //? jogador (8x8)
        super(id, coordinates, size, "simpleBullet", state, damage);

        this.hitboxes = [
            new HitBoxCircle(
                { x: this.coordinates.x + size.width / 2, y: this.coordinates.y + size.height / 2 },
                0, // rotation
                (otherElement: ObjectElement, selfElement: ObjectElement) => {
                    this.die(); // O projétil se destrói ao colidir com qualquer coisa.
                },
                size.width / 2 // radius
            )];
        this.direction = direction
        this.rotation = this.direction.angle()
        // this.generateRandomNoiseAccelerator()
    }

    public override move(deltaTime: number): void {
        const displacement = this.speed * deltaTime
        this.distanceTraveled += displacement

        if (this.distanceTraveled >= 80) this.die()

        // Define a direção e magnitude da velocidade, mas sem o deltaTime.
        this.velocity = this.direction
            .normalize()
            .multiply(displacement)
            .add(this.accelator);
        
        this.updatePosition();
    }

    protected override updatePosition(): void {
        super.updatePosition();
        this.hitboxes?.forEach(hb => hb.updatePosition({ x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }));
    }

    public update(deltaTime: number): void {
        this.move(deltaTime)
    }

    private die() {
        gameEvents.dispatch("despawn", { objectId: this.id })
    }

    private generateRandomNoiseAccelerator(): void {
        let lateral_noise_factor = 0.1
        const normalizedDirection = this.direction.clone().normalize();
        
        const perpendicularDirection = normalizedDirection.perpendicular(); 
        
        const randomFactor = Math.random() * 1 - 1;

        this.accelator = perpendicularDirection.multiply(randomFactor * lateral_noise_factor);
        
        const noiseOffset = perpendicularDirection.multiply(randomFactor * lateral_noise_factor);
        
        this.direction = normalizedDirection.add(noiseOffset).normalize(); 
    }
}