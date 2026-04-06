import type { SpriteConfig, GameObjectConstructorParams } from "../components/renderModule/visuals/GameObjectElement";
import type GameObjectElement from "../components/renderModule/visuals/GameObjectElement";
import { VisualConfigMap, type ItemVisualConfig } from "./VisualConfigMap";

/**
 * Sistema Central de Registro de Renderização.
 * Armazena dinamicamente as estratégias de criação e os sprites de cada objeto do jogo.
 */
export class RenderRegistry {
    public static strategies = new Map<string, (params: GameObjectConstructorParams) => GameObjectElement>();
    public static spriteConfigs = new Map<string, SpriteConfig>();

    static {
        for (const [objectId, config] of Object.entries(VisualConfigMap)) {
            if ('animations' in config && config.animations) {
                for (const [state, spriteConfig] of Object.entries(config.animations)) {
                    RenderRegistry.spriteConfigs.set(`${objectId}-${state}`, spriteConfig);
                }
            }
            if (config.category === 'equipment' || config.category === 'weapon') {
                const itemConfig = config as ItemVisualConfig;
                if (itemConfig.droppedConfig && itemConfig.iconId !== undefined) {
                    // Mapeia o item dropado pelo seu iconId para compatibilidade com o Domínio
                    RenderRegistry.spriteConfigs.set(`droppedItem-${itemConfig.iconId}`, itemConfig.droppedConfig);
                }
            }
        }
    }
}

/**
 * Decorator: Registra a classe de renderização (Fábrica) atrelada ao seu objectId.
 */
export function RegisterRenderer(entityId: string) {
    return function (target: any) {
        // Se a classe possui um método estático de fábrica (padrão do projeto), registra a estratégia
        if (target.createWithSprite && !RenderRegistry.strategies.has(entityId)) {
            RenderRegistry.strategies.set(entityId, target.createWithSprite.bind(target));
        } else if (!RenderRegistry.strategies.has(entityId)) {
            RenderRegistry.strategies.set(entityId, (params: GameObjectConstructorParams) => new target(params));
        }
    };
}