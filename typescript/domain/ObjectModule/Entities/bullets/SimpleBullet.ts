import Vector2D from "../../../shared/Vector2D";
import Attack from "../../Items/Attack";
import type ObjectElement from "../../ObjectElement";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import Bullet, { type bulletStates } from "./Bullet";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type { objectTypeId } from "../../objectType.type";

export class SimpleBullet extends Bullet {
    public accelerator: Vector2D = new Vector2D(0, 0);
    private speed:number = 150
    private distanceTraveled: number = 0
    private pierceCount: number = 0;
    private hitTargets: Set<number> = new Set();

    constructor (
        id: number,
        coordinates: { x: number; y: number; },
        direction: Vector2D,
        attack: Attack,
        eventManager: IEventManager,
        state :bulletStates = 'travelling',
        objectId: objectTypeId = 'simpleBullet',
        size: { width: number, height: number } = { width: 8, height: 8 }
    ){
    super(id, coordinates, size, objectId, eventManager, state);

        this.hitboxes = [...this.setHitboxes(size, attack)]
        this.direction = direction
        this.rotation = this.direction.angle()
        this.generateRandomNoiseAccelerator()
        this.pierceCount = attack.attacker.attributes.piercing || 0;
    }

    private setHitboxes(size :{ width :number, height :number }, attack :Attack ) :HitBoxCircle[]{
        return [ new HitBoxCircle(
            { x: this.coordinates.x + size.width / 2, y: this.coordinates.y + size.height / 2 },
            0, //* rotation
            size.width / 2, //* radius
            (otherElement: ObjectElement) => {

                if ('onStrike' in otherElement && otherElement.id !== attack.attacker.id) {
                    if (this.hitTargets.has(otherElement.id)) return; // Evita acertar o mesmo inimigo multiplas vezes no mesmo frame
                    
                    this.hitTargets.add(otherElement.id);
                    attack.execute(otherElement as any, this.direction);
                    
                    if (this.pierceCount > 0) {
                        this.pierceCount--; // Atravessa o inimigo e perde força de perfuração
                    } else {
                        super.destroy(); // Destrói se não tiver mais energia de perfuração
                    }
                }
            }
        )]
    }

    public update(deltaTime: number): void {
        this.move(deltaTime)
    }

    protected override updatePosition(): void {
        super.updatePosition();
        this.hitboxes?.forEach(hb => hb.updatePosition({ x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }));
    }

    public override move(deltaTime: number): void {
        const displacement = this.speed * deltaTime
        this.distanceTraveled += displacement

        if (this.distanceTraveled >= 150) super.destroy()

        // Define a direção e magnitude da velocidade, mas sem o deltaTime.
        this.velocity = this.direction.clone()
            .normalizeMut()
            .multiplyMut(displacement)
            .addMut(this.accelerator);
        
        this.rotation = this.direction.angle()

        this.updatePosition();
    }

    private generateRandomNoiseAccelerator(): void {
        let lateral_noise_factor = 0.1
        const normalizedDirection = this.direction.clone().normalizeMut();
        
        const random = Math.random() * 100
        let perpendicularDirection = normalizedDirection.perpendicularDireita()
        if (random < 50)
            perpendicularDirection = normalizedDirection.perpendicularDireita(); 
        else
            perpendicularDirection = normalizedDirection.perpendicularEsquerda();
        
        
        const randomFactor = Math.random() * 1 - 1;

        this.accelerator = perpendicularDirection.clone().multiplyMut(randomFactor * lateral_noise_factor).multiplyMut(0.5);
        
        const noiseOffset = perpendicularDirection.clone().multiplyMut(randomFactor * lateral_noise_factor);
        
        this.direction = normalizedDirection.clone().addMut(noiseOffset).normalizeMut(); 
    }
}