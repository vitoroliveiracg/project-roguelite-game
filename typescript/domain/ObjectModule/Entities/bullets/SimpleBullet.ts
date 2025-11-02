import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import Vector2D from "../../../shared/Vector2D";
import type { damageType } from "../../Items/IAtack";
import type ObjectElement from "../../ObjectElement";
import Enemy from "../Enemies/Enemy";
import Bullet, { type bulletStates } from "./Bullet";

export class SimpleBullet extends Bullet {
    public accelator: Vector2D = new Vector2D(0, 0);
    private speed:number = 150
    private distanceTraveled: number = 0

    constructor (
        id: number,
        coordinates: { x: number; y: number; },
        direction: Vector2D,
        totalDamage: number,
        damageType:damageType,
        isCritical:boolean,
        atackerId: number,
        state :bulletStates = 'travelling',
    ){
        const size = { width: 8, height: 8 }; //? jogador (8x8)
        super(
            id, 
            coordinates, 
            size, 
            "simpleBullet", 
            state, 
            atackerId,
            totalDamage,
            damageType,
            isCritical
        );

        this.hitboxes = [
            new HitBoxCircle(
                { x: this.coordinates.x + size.width / 2, y: this.coordinates.y + size.height / 2 },
                0, // rotation
                (otherElement: ObjectElement) => {
                    if (otherElement instanceof Enemy)
                        super.destroy()
                },
                size.width / 2
            )];
        this.direction = direction
        this.rotation = this.direction.angle()
        this.generateRandomNoiseAccelerator()
    }

    public override move(deltaTime: number): void {
        const displacement = this.speed * deltaTime
        this.distanceTraveled += displacement

        if (this.distanceTraveled >= 150) super.destroy()

        // Define a direção e magnitude da velocidade, mas sem o deltaTime.
        this.velocity = this.direction
            .normalize()
            .multiply(displacement)
            .add(this.accelator);
        
        this.rotation = this.direction.angle()

        this.updatePosition();
    }

    protected override updatePosition(): void {
        super.updatePosition();
        this.hitboxes?.forEach(hb => hb.updatePosition({ x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }));
    }

    public update(deltaTime: number): void {
        this.move(deltaTime)
    }

    private generateRandomNoiseAccelerator(): void {
        let lateral_noise_factor = 0.1
        const normalizedDirection = this.direction.clone().normalize();
        
        const random = Math.random() * 100
        let perpendicularDirection = normalizedDirection.perpendicularDireita()
        if (random < 50)
            perpendicularDirection = normalizedDirection.perpendicularDireita(); 
        else
            perpendicularDirection = normalizedDirection.perpendicularEsquerda();
        
        
        const randomFactor = Math.random() * 1 - 1;

        this.accelator = perpendicularDirection.multiply(randomFactor * lateral_noise_factor).multiply(0.5);
        
        const noiseOffset = perpendicularDirection.multiply(randomFactor * lateral_noise_factor);
        
        this.direction = normalizedDirection.add(noiseOffset).normalize(); 
    }
}