import type { SpriteConfig, GameObjectConstructorParams } from "../components/gameObjectModule/GameObjectElement";
import type GameObjectElement from "../components/gameObjectModule/GameObjectElement";

/**
 * Sistema Central de Registro de Renderização.
 * Armazena dinamicamente as estratégias de criação e os sprites de cada objeto do jogo.
 */
export class RenderRegistry {
    public static strategies = new Map<string, (params: GameObjectConstructorParams) => GameObjectElement>();
    public static spriteConfigs = new Map<string, SpriteConfig>();
}

/**
 * Decorator: Registra automaticamente uma classe visual e seu sprite no motor de renderização.
 */
export function RegisterSprite(entityId: string, state: string, config: SpriteConfig) {
    return function (target: any) {
        RenderRegistry.spriteConfigs.set(`${entityId}-${state}`, config);
        
        // Se a classe possui um método estático de fábrica (padrão do projeto), registra a estratégia
        if (target.createWithSprite && !RenderRegistry.strategies.has(entityId)) {
            RenderRegistry.strategies.set(entityId, target.createWithSprite.bind(target));
        } else if (!RenderRegistry.strategies.has(entityId)) {
            RenderRegistry.strategies.set(entityId, (params: GameObjectConstructorParams) => new target(params));
        }
    };
}