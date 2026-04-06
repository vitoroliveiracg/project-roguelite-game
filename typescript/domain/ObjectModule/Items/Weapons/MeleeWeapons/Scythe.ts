import MeleeWeapon from "./MeleeWeapon";
import type Entity from "../../../Entities/Entity";
import type Vector2D from "../../../../shared/Vector2D";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents";
import Attack from "../../Attack";
import "./ScytheSlash"; // Força o Vite a ler o arquivo e registrar a fábrica no SpawnRegistry!

export default class Scythe extends MeleeWeapon {
    constructor() {
        super(
            20, 0.5, 'Foice da Morte', 'Ceifa a alma dos inimigos em área rotacional.', 3, 'rare', 3, 100, 100, [], 1, {}, false, true, 'Necromante'
        );
        // Esses valores não serão usados pelo ScytheSlash (ele usa o tamanho real do sprite),
        // mas são mantidos aqui para a interface original da MeleeWeapon.
        this.attackRange = 80;
        this.attackAngle = 180;
    }

    public override attack(attacker: Entity, direction: Vector2D, eventManager: IEventManager): void {
        const scaledDamage = this.baseDamage + Math.floor(attacker.attributes.strength);
        const weaponAttack = new Attack(attacker, scaledDamage, 'physical', this.onHitActions);

        // Dispara a Entidade Física "ScytheSlash", que varrerá os polígonos quadro a quadro!
        eventManager.dispatch('spawn', {
            type: 'scytheSlash',
            coordinates: { x: attacker.coordinates.x, y: attacker.coordinates.y },
            direction: direction,
            attack: weaponAttack,
            attacker: attacker // Passamos a entidade de forma limpa e pública no payload
        });
    }
}