import type GameAdapter from "../GameAdapter";

export function initEvents(gameAdapter : GameAdapter){

  document.addEventListener("keydown", event=>{

    if(event.key === "a"){
      gameAdapter.keyPressed("a");
    }

  })

}