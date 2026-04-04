import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig }  from "./GameObjectElement";
import VisualComposer from "./VisualComposer";
import type { EntityRenderableState } from "../../../../../domain/ports/domain-contracts";
import { logger } from "../../../shared/Logger";

export default class LayeredGameObjectElement extends GameObjectElement {
    protected allConfigs: Map<string, SpriteConfig>;
    protected imageCache: Map<string, HTMLImageElement>;
    
    protected composedLayers: { config: SpriteConfig, image: HTMLImageElement, zIndex: number }[] = [];

    constructor(params: GameObjectConstructorParams) {
        super(params.initialState, undefined, document.createElement('img'));
        this.allConfigs = params.configs;
        this.imageCache = params.imageCache;
        this.recompose(params.initialState);
    }

    protected recompose(state: EntityRenderableState) {
        const layers = VisualComposer.extractLayers(state);
        const composed = VisualComposer.compose(layers, this.allConfigs, state.state || 'idle');
        
        this.composedLayers = composed.map(c => {
            const image = this.imageCache.get(c.config.imageSrc);
            if (!image) logger.log('error', `Imagem de equipamento faltando no cache: ${c.config.imageSrc}`);
            return { config: c.config, image: image!, zIndex: c.zIndex };
        }).filter(c => c.image !== undefined);
    }

    public override updateState(newState: EntityRenderableState): void {
        super.updateState(newState);
        this.recompose(newState);
    }

    protected override updateAnimation(): void {
        if (this.composedLayers.length > 0) {
            const baseConfig = this.composedLayers[0]!.config; // Guia a animação pelo elemento base
            this.frameCounter++;
            if (this.frameCounter >= baseConfig.animationSpeed) {
                this.frameCounter = 0;
                this.currentFrame = (this.currentFrame + 1) % baseConfig.frameCount;
            }
        } else {
            super.updateAnimation();
        }
    }

    public override draw(ctx: CanvasRenderingContext2D): void {
        if (this.composedLayers.length === 0) {
            super.draw(ctx);
            return;
        }

        ctx.save();
        const centerX = this.coordinates.x + this.size.width / 2;
        const centerY = this.coordinates.y + this.size.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        ctx.translate(-centerX, -centerY);

        this.updateAnimation();
        ctx.imageSmoothingEnabled = false;

        for (const layer of this.composedLayers) {
            const layerFrame = this.currentFrame % layer.config.frameCount;
            const columns = Math.max(1, Math.floor(layer.image.width / layer.config.frameWidth));
            const sourceX = (layerFrame % columns) * layer.config.frameWidth;
            const sourceY = Math.floor(layerFrame / columns) * layer.config.frameHeight;
            
            // Descobre a proporção real caso a HitBox (this.size) não seja 32x32
            const baseFrameWidth = this.composedLayers[0]!.config.frameWidth;
            const baseFrameHeight = this.composedLayers[0]!.config.frameHeight;
            const scaleX = this.size.width / baseFrameWidth;
            const scaleY = this.size.height / baseFrameHeight;

            const rawOffset = layer.config.renderOffset;
            const currentOffset = (Array.isArray(rawOffset) ? rawOffset[this.currentFrame % rawOffset.length] : rawOffset) || { x: 0, y: 0 };

            const destX = this.coordinates.x + currentOffset.x * scaleX;
            const destY = this.coordinates.y + currentOffset.y * scaleY;
            const destWidth = layer.config.frameWidth * scaleX;
            const destHeight = layer.config.frameHeight * scaleY;

            ctx.drawImage(layer.image, sourceX, sourceY, layer.config.frameWidth, layer.config.frameHeight, destX, destY, destWidth, destHeight);
        }
        ctx.restore();
    }
}