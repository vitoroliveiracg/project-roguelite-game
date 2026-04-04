/** @file Contém a classe `Player`, a representação visual do jogador. */
import LayeredGameObjectElement from "../visuals/LayeredGameObjectElement";
import { type GameObjectConstructorParams } from "../visuals/GameObjectElement";
import { RegisterRenderer } from "../../../shared/RenderRegistry";

@RegisterRenderer('player')
export default class Player extends LayeredGameObjectElement {
  constructor({ initialState, configs, imageCache }: GameObjectConstructorParams) {
    super({ initialState, configs, imageCache });
  }
}