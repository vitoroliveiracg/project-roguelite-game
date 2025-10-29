import Enemy from "./Entities/Enemies/Enemy";
import Player from "./Entities/Player/Player";
import type ObjectElement from "./ObjectElement";

/** @file A responsabilidade da classe rendable controller é fazer o controle dos objetos renderizaveis */
export let rendables :Array<ObjectElement> = [];

export function addRendable(rendable: ObjectElement) {
  rendables.push(rendable);
}
export function addRendables(newRendables: ObjectElement[]) {
  newRendables.forEach(rendable => {
    rendables.push(rendable);
  });
}

export function removeRendable(rendableToRemove: ObjectElement) {
  rendables = rendables.filter(element => element.id !== rendableToRemove.id);
}

export function runRendableSetup(playerConfig: { id: number; level: number; initialPos: { x: number; y: number } }){
  
  let player = new Player(
    playerConfig.id, 
    playerConfig.level, 
    playerConfig.initialPos, 
    10, 10, 10, 10, 10
  );
  const enemy = new Enemy(2, 1, {x: 0, y: 0}, 10, 10, 10, 10, 10);

  addRendables([player, enemy]);
}
