import type { SpriteConfig } from "../components/renderModule/visuals/GameObjectElement"; 

export type VisualCategory = 'entity' | 'equipment' | 'weapon' | 'projectile' | 'vfx';

export interface BaseVisualConfig {
    category: VisualCategory;
    animations: Record<string, SpriteConfig>; // Mapeia 'estado' -> 'SpriteConfig'
}
export interface EntityVisualConfig extends BaseVisualConfig {
    category: 'entity';
}
export interface ItemVisualConfig extends BaseVisualConfig {
    category: 'equipment' | 'weapon';
    iconId: number; // O ID do ícone que conecta com o Domínio
    uiIconUrl: string; // Imagem mostrada na bolsa e nos slots do Paper Doll
    droppedConfig: SpriteConfig; // Configuração visual para quando o item estiver no chão
}
export interface ProjectileVisualConfig extends BaseVisualConfig {
    category: 'projectile';
}
export interface VFXVisualConfig extends BaseVisualConfig {
    category: 'vfx';
}
export type AnyVisualConfig = EntityVisualConfig | ItemVisualConfig | ProjectileVisualConfig | VFXVisualConfig;

export const VisualConfigMap: Record<string, AnyVisualConfig> = {
   
    // ================== ENTIDADES (Corpos) ==================
    'player': {
        category: 'entity',
        animations: {
            'idle': { imageSrc: new URL('../assets/entities/player/player-idle.png', import.meta.url).href, frameCount: 2, animationSpeed: 20, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 32, height: 32 } },
            'walking': { imageSrc: new URL('../assets/entities/player/player-idle.png', import.meta.url).href, frameCount: 2, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 32, height: 32 } },
            'dead': { imageSrc: new URL('../assets/entities/player/player-idle.png', import.meta.url).href, frameCount: 2, animationSpeed: 20, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 32, height: 32 } }
        }
    },
    'slime': {
        category: 'entity',
        animations: {
            'waiting': { imageSrc: new URL('../assets/entities/slime-green-walk.png', import.meta.url).href, frameCount: 8, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 64, y: 0 }, spriteSize: { width: 32, height: 32 } },
            'walking': { imageSrc: new URL('../assets/entities/slime-green-walk.png', import.meta.url).href, frameCount: 8, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 64, y: 0 }, spriteSize: { width: 32, height: 32 } }
        }
    },
    'circle': {
        category: 'entity',
        animations: { 'normal': { imageSrc: '', frameCount: 1, animationSpeed: 1, frameWidth: 1, frameHeight: 1 } }
    },

    // ================== ITENS E EQUIPAMENTOS ==================
    'iron-helmet': {
        category: 'equipment',
        iconId: 10, // Liga ao iconId: 10 do Domínio
        uiIconUrl: new URL('../assets/itens/capacete-simples.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {
            'idle': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 20, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 0 }, { x: 5, y: 1 }] },
            'walking': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 0 }, { x: 5, y: 1 }] },
            'dead': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 20, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 0 }, { x: 5, y: 1 }] }
        }
    },
    'iron-chestplate': {
        category: 'equipment', iconId: 11,
        uiIconUrl: new URL('../assets/itens/capacete-simples.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {
            'idle': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 20, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 8 }, { x: 5, y: 9 }] },
            'walking': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 8 }, { x: 5, y: 9 }] },
        }
    },
    'iron-pants': {
        category: 'equipment', iconId: 12,
        uiIconUrl: new URL('../assets/itens/capacete-simples.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {
            'idle': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 20, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 16 }, { x: 5, y: 17 }] },
            'walking': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 16 }, { x: 5, y: 17 }] },
        }
    },
    'iron-boots': {
        category: 'equipment', iconId: 13,
        uiIconUrl: new URL('../assets/itens/capacete-simples.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {
            'idle': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 20, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 24 }, { x: 5, y: 25 }] },
            'walking': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 5, y: 24 }, { x: 5, y: 25 }] },
        }
    },
    'iron-gloves': {
        category: 'equipment', iconId: 14,
        uiIconUrl: new URL('../assets/itens/capacete-simples.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {
            'idle': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 20, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 0, y: 12 }, { x: 0, y: 13 }] },
            'walking': { imageSrc: new URL('../assets/itens/capacete-simples.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 22, frameHeight: 16, atlasOffset: { x: 0, y: 0 }, spriteSize: { width: 22, height: 16 }, renderOffset: [{ x: 0, y: 12 }, { x: 0, y: 13 }] },
        }
    },
    'staff': {
        category: 'weapon', iconId: 1,
        uiIconUrl: new URL('../assets/itens/staff-design-1.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/staff-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {}
    },
    'gun': {
        category: 'weapon', iconId: 2,
        uiIconUrl: new URL('../assets/itens/gun-design-1.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/gun-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {}
    },
    'scythe': {
        category: 'weapon', iconId: 3,
        uiIconUrl: new URL('../assets/itens/scythe-design-1.png', import.meta.url).href,
        droppedConfig: { imageSrc: new URL('../assets/itens/scythe-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } },
        animations: {}
    },

    // ================== PROJÉTEIS & VFX ==================
    'simpleBullet': {
        category: 'projectile',
        animations: { 'travelling': { imageSrc: new URL('../assets/entities/simple-bullet.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 16, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 16, height: 16 } } }
    },
    'magicMissile': {
        category: 'projectile',
        animations: { 'travelling': { imageSrc: new URL('../assets/entities/simple-bullet.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 16, frameHeight: 16, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 16, height: 16 } } }
    },
    'scytheProjectile': {
        category: 'projectile',
        animations: { 'travelling': { imageSrc: new URL('../assets/itens/scythe-design-1.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } } }
    },
    'fireball': {
        category: 'projectile',
        animations: { 'travelling': { imageSrc: new URL('../assets/entities/firebola.png', import.meta.url).href, frameCount: 1, animationSpeed: 10, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 32, height: 32 } } }
    },
    'explosion': {
        category: 'vfx',
        animations: { 'active': { imageSrc: new URL('../assets/entities/explosion.png', import.meta.url).href, frameCount: 16, animationSpeed: 1, frameWidth: 32, frameHeight: 32, atlasOffset: { x: 0, y: 32 }, spriteSize: { width: 128, height: 128 } } }
    }
};