import { gameEvents } from "../../../eventDispacher/eventDispacher";
import Vector2D from "../../../shared/Vector2D";
import Bullet, { type bulletStates } from "./Bullet";

export class SimpleBullet extends Bullet {
    public accelator: Vector2D = new Vector2D(0, 0);
    private speed:number = 150
    private distanceTraveled: number = 0

    constructor (
        id: number,
        coordinates: { x: number; y: number; },
        direction: Vector2D,
        state :bulletStates = 'travelling'
    ){
        const size = { width: 8, height: 8 }; //? jogador (8x8)
        super(id, coordinates, size, "simpleBullet", state)
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
        
        super.updatePosition();
    }

    public update(deltaTime: number): void {
        this.move(deltaTime)
    }

    private die() {
        gameEvents.dispatch("bulletDie", { bulletId: this.id })
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