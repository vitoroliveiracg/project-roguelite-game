import type IRenderable from "../visuals/IRenderable";
import Particles from "./Particles";
import type { ParticleEmitterConfig } from "./ParticleEmitterConfig";

/**
 * @class ParticleOrchestrator
 * Fachada (Facade) de alto nível para o sistema de partículas.
 * Fornece métodos semânticos e pré-configurados para a criação rápida de efeitos visuais complexos.
 * Implementa `IRenderable` para se integrar nativamente ao pipeline de renderização existente.
 */
export default class ParticleOrchestrator implements IRenderable {
    // Propriedades de IRenderable ignoradas matematicamente, usadas apenas para satisfazer o contrato com a Engine visual
    public id: number = -999999;
    public readonly coordinates = { x: 0, y: 0 };
    public readonly size = { width: 0, height: 0 };
    public readonly rotation: number = 0;

    private particles: Particles;

    constructor(maxParticles: number = 3000) {
        this.particles = new Particles(maxParticles);
    }

    /** 
     * Integração com o Game Loop.
     * Avança a física de todas as milhares de partículas vivas.
     */
    public updateAnimations(deltaTime: number): void {
        this.particles.update(deltaTime);
    }

    /** Satisfaz o contrato IRenderable. Não faz nada pois partículas são dirigidas por eventos e não por DTOs contínuos. */
    public updateState(newState: any): void {}

    /** 
     * Integração com a Engine Visual.
     * Desenha a nuvem de partículas no mundo, já com a translação da Câmera aplicada pelo Renderer!
     */
    public draw(ctx: CanvasRenderingContext2D): void {
        this.particles.draw(ctx);
    }

    // ============================================================================
    // BIBLIOTECA DE EFEITOS VISUAIS (VFX) SEMÂNTICOS
    // ============================================================================

    /** Sangue espirrando e caindo rapidamente com gravidade. Ideal para dano físico. */
    public bloodSplatter(x: number, y: number): void {
        this.particles.emit({
            x, y,
            count: 15,
            colors: ['#8a0303', '#ff0000', '#5e0000'],
            speedMin: 50, speedMax: 200,
            sizeMin: 2, sizeMax: 5,
            lifeMin: 0.2, lifeMax: 0.6,
            angle: 0, spread: Math.PI * 2,
            gravity: 500, // Gravidade forte puxando o sangue pro chão
            friction: 0.90, // Perde velocidade horizontal rapidamente
        });
    }

    /** Fogo intenso que se expande e sobe aos céus, desaparecendo rápido. Ideal para a Fireball. */
    public fireExplosion(x: number, y: number): void {
        this.particles.emit({
            x, y,
            count: 35,
            colors: ['#FFA500', '#FF4500', '#FF0000', '#FFFF00'],
            speedMin: 100, speedMax: 350,
            sizeMin: 3, sizeMax: 8,
            lifeMin: 0.2, lifeMax: 0.7,
            angle: 0, spread: Math.PI * 2, // 360 graus
            gravity: -150, // Fogo "cai" para cima
            friction: 0.92,
        });
    }

    /** Uma energia suave que orbita ou sobe a partir de uma entidade. */
    public magicAura(x: number, y: number, hexColor: string = '#00FFFF'): void {
        this.particles.emit({
            x, y,
            count: 8,
            colors: [hexColor, '#FFFFFF'],
            speedMin: 10, speedMax: 50,
            sizeMin: 2, sizeMax: 4,
            lifeMin: 0.5, lifeMax: 1.5,
            angle: -Math.PI / 2, spread: Math.PI, // Espalha pra cima
            gravity: -50, // Flutua lentamente
            friction: 0.98,
        });
    }

    /** Faíscas brilhantes direcionais que ricocheteiam. Ideal para impactos de espada. */
    public slashSparks(x: number, y: number, angle: number): void {
        this.particles.emit({
            x, y,
            count: 20,
            colors: ['#FFFFFF', '#FFD700', '#FFA500'],
            speedMin: 200, speedMax: 500,
            sizeMin: 1, sizeMax: 4,
            lifeMin: 0.1, lifeMax: 0.4,
            angle: angle, spread: Math.PI / 3, // Cone de faíscas focado na direção do golpe
            gravity: 100,
            friction: 0.90,
        });
    }

    /** Explosão de água com física de gotas que caem redondas. */
    public waterSplash(x: number, y: number): void {
        this.particles.emit({
            x, y,
            count: 25,
            colors: ['#00BFFF', '#1E90FF', '#E0FFFF'],
            speedMin: 80, speedMax: 250,
            sizeMin: 2, sizeMax: 6,
            lifeMin: 0.3, lifeMax: 0.7,
            angle: -Math.PI / 2, spread: Math.PI * 1.5, // Jorra majoritariamente pra cima
            gravity: 800, // Cai muito rápido e pesado
            friction: 0.98,
        });
    }

    /** Fumaça ou gás venenoso que desacelera muito rápido e se dissipa no lugar. */
    public poisonCloud(x: number, y: number): void {
        this.particles.emit({
            x, y,
            count: 40,
            colors: ['#32CD32', '#228B22', '#00FF00', '#6B8E23'],
            speedMin: 20, speedMax: 100,
            sizeMin: 4, sizeMax: 10,
            lifeMin: 0.5, lifeMax: 2.0,
            angle: 0, spread: Math.PI * 2,
            gravity: -20, // Sobe bem devagarinho
            friction: 0.85, // Freia de forma abrupta, criando um aspecto de "nuvem" pesada
            fade: true
        });
    }

    /** Explosão majestosa e azulada com vida longa, para celebrar a subida de nível! */
    public levelUp(x: number, y: number, hexColor?: string): void {
        const colors = hexColor ? [hexColor, '#FFFFFF', '#E0FFFF'] : ['#00aaff', '#00ffff', '#e0ffff', '#87cefa'];
        this.particles.emit({
            x, y,
            count: 60,
            colors: colors,
            speedMin: 100, speedMax: 300,
            sizeMin: 3, sizeMax: 7,
            lifeMin: 1.0, lifeMax: 2.5,
            angle: -Math.PI / 2, spread: Math.PI * 2, // Em todas as direções
            gravity: -100, // Lentamente puxado para os céus
            friction: 0.95,
        });
    }

    /**
     * Rastro dinâmico para as magias modulares não listadas. 
     * Ele agrupa as cores das essências da array para criar uma aura híbrida em volta da bola.
     */
    public dynamicSpellTrail(x: number, y: number, elements: string[]): void {
        const colorMap: Record<string, string[]> = {
            'fire': ['#FFA500', '#FF4500', '#FF0000'],
            'water': ['#00BFFF', '#1E90FF', '#E0FFFF'],
            'nature': ['#32CD32', '#228B22', '#00FF00'],
            'thunder': ['#FFFF00', '#FFD700', '#FFFACD'],
            'light': ['#FFFFFF', '#FFF8DC', '#F0E68C'],
            'magic': ['#8A2BE2', '#9400D3', '#DA70D6']
        };

        let activeColors: string[] = [];
        for (const el of elements) {
            if (colorMap[el]) activeColors.push(...colorMap[el]);
        }
        if (activeColors.length === 0) activeColors = ['#FFFFFF'];

        this.particles.emit({
            x, y,
            count: 2 * elements.length, // Se a magia tem 3 elementos combinados, a aura é mais forte!
            colors: activeColors,
            speedMin: 5, speedMax: 20,
            sizeMin: 2, sizeMax: 5,
            lifeMin: 0.1, lifeMax: 0.4,
            angle: 0, spread: Math.PI * 2, // Orbitando ao redor
            fade: true
        });
    }

    /**
     * Permite emitir um efeito totalmente sob demanda customizado.
     */
    public customEmit(config: ParticleEmitterConfig): void {
        this.particles.emit(config);
    }
}