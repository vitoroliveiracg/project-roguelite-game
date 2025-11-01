/** @file Contém a classe `Enemy`, a representação visual de um inimigo no jogo. */
import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";

//? Esse type é muito importante
export type BulletConstructorParams = GameObjectConstructorParams;

/** @class Enemy Herda de `GameObjectElement` e usa sua funcionalidade padrão de sprite. */
export default class CircleForm extends GameObjectElement {
    /**
     * O construtor é protegido para permitir que subclasses (como BlackEnemy) o chamem
     * com parâmetros diferentes, enquanto a criação normal ainda é feita via factory.
     */
    constructor({ initialState, configs, imageCache }: BulletConstructorParams) {
        super(initialState, undefined, document.createElement('img'));
    }

    public override draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
            this.coordinates.x, // Centro X
            this.coordinates.y, // Centro Y
            this.size.width,  // Raio (Use o raio da sua hitbox real)
            0,                  // Ângulo inicial (0 radianos)
            2 * Math.PI         // Ângulo final (360 graus em radianos)
        );
        ctx.stroke();
        ctx.restore();
    }
}