/**
 * Configuração dinâmica para a emissão de partículas.
 * Permite criar desde explosões e espirros de sangue até auras contínuas e rastros de magias.
 */
export interface ParticleEmitterConfig {
    x: number;
    y: number;
    count: number;
    colors: string[];
    speedMin: number;
    speedMax: number;
    sizeMin: number;
    sizeMax: number;
    lifeMin: number;
    lifeMax: number;
    /** Ângulo base da emissão em radianos (ex: Math.PI / 2 para baixo) */
    angle: number;
    /** Abertura do cone de dispersão em radianos (ex: Math.PI * 2 para uma explosão 360º) */
    spread: number;
    /** Gravidade aplicada no eixo Y (pixels por segundo ao quadrado) */
    gravity?: number;
    /** Atrito aplicado na velocidade (0.0 a 1.0, onde 1.0 é sem atrito) */
    friction?: number;
    /** Se a partícula deve desaparecer suavemente (fade out) ao longo da vida */
    fade?: boolean;
    /** Renderiza a partícula organicamente como um círculo em vez de um quadrado (Serotonérgico) */
    isCircle?: boolean;
}