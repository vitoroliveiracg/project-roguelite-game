import Projectile from "./Projectile";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import { RegisterSpawner } from "../../SpawnRegistry";
import type Attack from "../../Items/Attack";
import type Vector2D from "../../../shared/Vector2D";
import type ObjectElement from "../../ObjectElement";

@RegisterSpawner('fishingHook')
export default class FishingHook extends Projectile {
    private attack: Attack;

    constructor(
        id: number,
        payload: { coordinates: { x: number, y: number }, direction: Vector2D, attack: Attack },
        eventManager: IEventManager
    ) {
        super(id, payload.coordinates, { width: 16, height: 16 }, 'fishingHook' as any, eventManager, 'travelling');
        
        this.direction = payload.direction;
        this.attack = payload.attack;
        this.rotation = this.direction.angle();
        
        // Hitbox simples circular
        this.hitboxes = [
            new HitBoxCircle(
                { x: this.coordinates.x + 8, y: this.coordinates.y + 8 }, 
                0, // Rotação da HitBox (necessário na assinatura)
                8, 
                this.onColision.bind(this)
            )
        ];
    }

    public override update(deltaTime: number): void {
        const speed = 600;
        const displacement = speed * deltaTime;
        
        this.velocity = this.direction.clone().normalizeMut().multiplyMut(displacement);
        
        super.updatePosition();
        
        this.hitboxes?.forEach(hb => hb.updatePosition({ 
            x: this.coordinates.x + this.size.width / 2, 
            y: this.coordinates.y + this.size.height / 2 
        }));
    }

    private onColision(otherElement: ObjectElement): void {
        // Aplica o ataque no alvo (o que engatilhará a "pesca") e destrói o anzol
        if ('takeDamage' in otherElement && otherElement.id !== this.attack.attacker.id) {
            this.attack.execute(otherElement as any, this.direction);
            this.destroy(); // Some do mapa após fisgar!
        }
    }
}