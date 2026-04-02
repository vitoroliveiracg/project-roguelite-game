import GameObjectElement, { type GameObjectConstructorParams, type SpriteConfig } from "../GameObjectElement";
import { RegisterSprite } from "../../../shared/RenderRegistry";

//? Esse type é muito importante
export type BulletConstructorParams = GameObjectConstructorParams;

const dummyConfig: SpriteConfig = { imageSrc: '', frameCount: 1, animationSpeed: 1, frameWidth: 1, frameHeight: 1 };

@RegisterSprite('circle', 'normal', dummyConfig)
export default class CircleForm extends GameObjectElement {

    constructor({ initialState }: BulletConstructorParams) {
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