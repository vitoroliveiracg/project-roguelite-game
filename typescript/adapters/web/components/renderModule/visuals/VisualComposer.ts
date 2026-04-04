import type { SpriteConfig } from "./GameObjectElement"; 
import { VisualConfigMap, type ItemVisualConfig } from "../../../shared/GlobalVisualRegistry";

export type EquipmentLayerType = 'body' | 'pants' | 'boots' | 'chestplate' | 'beard' | 'helmet' | 'hand' | 'gloves' | 'amulet' | 'ring';

export interface VisualLayer {
    id: string;
    type: EquipmentLayerType | string;
}

export default class VisualComposer {
    /** Z-Index Base padrão para que os equipamentos se sobreponham de forma previsível. */
    private static defaultZIndex: Record<string, number> = {
        'body': 0,
        'pants': 10,
        'boots': 20,
        'chestplate': 30,
        'beard': 35,
        'helmet': 40,
        'gloves': 50,
        'hand': 60
    };

    public static extractLayers(state: any): VisualLayer[] {
        const layers: VisualLayer[] = [{ id: state.entityTypeId, type: 'body' }];

        if (state.equipment) {
            const armorSlots = ['chestplate', 'helmet', 'pants', 'boots', 'gloves'];
            for (const slot of armorSlots) {
                const item = state.equipment[slot];
                if (item && item.iconId !== undefined) {
                    const entry = Object.entries(VisualConfigMap).find(([key, config]) => 
                        (config.category === 'equipment' || config.category === 'weapon') && 
                        Number((config as ItemVisualConfig).iconId) === Number(item.iconId)
                    );
                    if (entry) layers.push({ id: entry[0], type: slot });
                }
            }
        }

        if (state.hasBeard) {
            layers.push({ id: 'player-beard', type: 'beard' });
        }

        return layers;
    }

    /**
     * Motor de Regras: Avalia as camadas e resolve as exceções de sobreposição (Z-Index).
     */
    public static compose(layers: VisualLayer[], configs: Map<string, SpriteConfig>, state: string): { config: SpriteConfig, zIndex: number }[] {
        const composed = layers.map(layer => {
            let zIndex = this.defaultZIndex[layer.type] || 0;

            // REGRA DE EXCEÇÃO: Se a entidade tem Barba e Peitoral, a barba DEVE esconder parte do peito (ficar por cima).
            if (layer.type === 'beard') {
                const hasChestplate = layers.some(l => l.type === 'chestplate');
                if (hasChestplate) {
                    zIndex = 100; // Força a barba para a estratosfera do Z-Index
                }
            }

            // Resgata o Sprite correspondente à animação atual (ex: 'iron-chest-walking')
            const configKey = `${layer.id}-${state}`;
            const config = configs.get(configKey);
            
            return { config, zIndex };
        });

        // Ignora camadas com sprites faltantes e ordena a pintura pelo Z-Index calculado
        return composed.filter(item => item.config !== undefined).sort((a, b) => a.zIndex - b.zIndex) as { config: SpriteConfig, zIndex: number }[];
    }
}