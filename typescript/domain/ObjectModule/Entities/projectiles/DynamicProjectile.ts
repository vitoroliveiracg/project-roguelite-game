import Bullet from "./Bullet";
import type Vector2D from "../../../shared/Vector2D";
import type Attack from "../../Items/Attack";
import type Effect from "../../Items/Effects/Effect";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import type ObjectElement from "../../ObjectElement";
import { RegisterSpawner, type SpawnPayload } from "../../SpawnRegistry";
import FireEffect from "../../Items/Effects/ElementalEffects/FireEffect";
import WaterEffect from "../../Items/Effects/ElementalEffects/WaterEffect";
import PoisonEffect from "../../Items/Effects/ElementalEffects/PoisonEffect";
import ThunderEffect from "../../Items/Effects/ElementalEffects/ThunderEffect";
import LightEffect from "../../Items/Effects/ElementalEffects/LightEffect";
import MagicEffect from "../../Items/Effects/ElementalEffects/MagicEffect";

@RegisterSpawner('dynamicSpell')
export class DynamicProjectile extends Bullet {
    private speed: number = 300;
    private distanceTraveled: number = 0;
    private hitTargets: Set<number> = new Set();
    
    public effects: Effect[];
    public attack: Attack;
    public spellElements: string[]; // <--- As essências que darão cor à magia no Visual!
    
    public static readonly BASE_SIZE = { width: 10, height: 10 };

    constructor(
        id: number, coordinates: { x: number; y: number; }, direction: Vector2D,
        attack: Attack, effects: Effect[] = [], eventManager: IEventManager,
        elements: string[] = [],
        size: { width: number, height: number } = DynamicProjectile.BASE_SIZE
    ) {
        super(id, coordinates, size, 'dynamicSpell' as any, eventManager, 'travelling');
        this.direction = direction;
        this.attack = attack;
        this.effects = effects;
        this.spellElements = elements;
        this.hitboxes = [...this.setHitboxes(DynamicProjectile.BASE_SIZE)];
        this.rotation = this.direction.angle();
    }

    private setHitboxes(size: { width: number, height: number }): HitBoxCircle[] {
        return [new HitBoxCircle({ x: this.coordinates.x + size.width / 2, y: this.coordinates.y + size.height / 2 }, 0, size.width / 2, (otherElement: ObjectElement) => {
            if ('takeDamage' in otherElement && otherElement.id !== this.attack.attacker.id) {
                if (this.hitTargets.has(otherElement.id)) return;
                this.hitTargets.add(otherElement.id);
                this.attack.execute(otherElement as any, this.direction);
                this.effects.forEach(effect => effect.apply(otherElement as any));
                super.destroy();
            }
        })];
    }

    public update(deltaTime: number): void {
        const displacement = this.speed * deltaTime;
        this.distanceTraveled += displacement;
        if (this.distanceTraveled >= 500) super.destroy(); // Vai bem longe
        this.velocity = this.direction.clone().normalizeMut().multiplyMut(displacement);
        this.rotation = this.direction.angle();
        super.updatePosition();
        this.hitboxes?.forEach(hb => hb.updatePosition({ x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }));
    }

    public static createSpawn(id: number, payload: SpawnPayload, eventManager: IEventManager): DynamicProjectile {
        const areaMult = payload.attack?.attacker?.attributes?.areaMultiplier || 1;
        const size = { 
            width: DynamicProjectile.BASE_SIZE.width * areaMult, 
            height: DynamicProjectile.BASE_SIZE.height * areaMult 
        };
        
        const centeredCoordinates = { x: payload.coordinates.x - size.width / 2, y: payload.coordinates.y - size.height / 2 };
        
        const elementalEffects: Effect[] = [];
        const source = payload.attack?.attacker;
        
        if (source && payload.spellElements) {
            for (const el of payload.spellElements) {
                if (el === 'fire') elementalEffects.push(new FireEffect(source));
                if (el === 'water') elementalEffects.push(new WaterEffect());
                if (el === 'nature') elementalEffects.push(new PoisonEffect(source));
                if (el === 'thunder') elementalEffects.push(new ThunderEffect());
                if (el === 'light') elementalEffects.push(new LightEffect(source));
                if (el === 'magic') elementalEffects.push(new MagicEffect());
            }
        }
        
        return new DynamicProjectile(id, centeredCoordinates, payload.direction!, payload.attack!, elementalEffects, eventManager, payload.spellElements || [], size);
    }
}