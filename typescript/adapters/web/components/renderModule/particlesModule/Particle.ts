/**
 * Estrutura interna de dados para uma partícula.
 * Desacoplada e reciclável para evitar gargalos de Garbage Collection.
 */
export default class Particle {
    x: number = 0;
    y: number = 0;
    vx: number = 0;
    vy: number = 0;
    life: number = 0;
    maxLife: number = 0;
    color: string = '#FFF';
    size: number = 1;
    gravity: number = 0;
    friction: number = 1;
    fade: boolean = true;
    isCircle: boolean = false;
}
