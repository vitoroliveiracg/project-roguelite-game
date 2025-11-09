import type { SpriteConfig } from "./WebGPURenderer";

/**
 * Gerencia o estado da animação de um único objeto renderizável.
 */
export class AnimationManager {
    public currentFrame: number = 0;
    private frameCounter: number = 0;
    private config: SpriteConfig;

    constructor(config: SpriteConfig) {
        this.config = config;
    }

    /**
     * Atualiza o estado da animação com base no tempo decorrido.
     * @param deltaTime O tempo em segundos desde o último frame.
     */
    public update(deltaTime: number): void {
        // Converte deltaTime para um contador de frames de animação
        this.frameCounter += deltaTime * 60; // Assumindo um jogo base de 60 FPS

        if (this.frameCounter >= this.config.animationSpeed) {
            this.frameCounter = 0;
            this.currentFrame = (this.currentFrame + 1) % this.config.frameCount;
        }
    }

    /**
     * Troca a configuração da animação, resetando o estado.
     * @param newConfig A nova configuração de sprite.
     */
    public setConfig(newConfig: SpriteConfig): void {
        // Troca a animação se o offset no atlas ou o número de frames for diferente.
        if (this.config.atlasOffset.x !== newConfig.atlasOffset.x ||
            this.config.atlasOffset.y !== newConfig.atlasOffset.y ||
            this.config.frameCount !== newConfig.frameCount) {
            this.config = newConfig;
            this.currentFrame = 0;
            this.frameCounter = 0;
        }
    }
}