import { gameEvents } from "../../../domain/eventDispacher/eventDispacher";
import EntityElement from "./entityModule/EntityElement";
import { draw } from "./Game";

export default class GameAdapter {

  private keysToPress = {
    aKey: "a"
  }

  public initialize(){
    this.handleEvents();
    draw(0);
  }

  private handleEvents(){
    gameEvents.on("messageReceived", parameters=>{
      let entity:EntityElement = new EntityElement()
      entity.takeAction(parameters.message)
      // TODO: Implementar a lógica que usava o EntityElement
      console.log("messageReceived:", parameters.message);
    })

  }

  public keyPressed (key:string) {
    switch (key) {
      case this.keysToPress.aKey:
        this.logDrawKey()
        break;
    
      default:
        break;
    }
  }

  private logDrawKey () {
    gameEvents.dispatch("log", {})
  }

}
