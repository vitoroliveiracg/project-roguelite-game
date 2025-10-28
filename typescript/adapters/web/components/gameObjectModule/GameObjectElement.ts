import { logger } from "../../shared/Logger";
import type IRenderable from "../renderModule/IRenderable";

export default class GameObjectElement implements IRenderable {
  
  readonly coordinates : { x: number, y :number }
  readonly size: { width: number; height: number };
  public id: number  

  constructor (newState: any) {
    this.coordinates = newState.coordenates// this.coordinates = newState.
    this.size = newState.size
    this.id = newState.id
  }

  public updateState (newState: any): void {
  }

  public draw (ctx: CanvasRenderingContext2D): void {
    logger.log('render', 'Rendering black box')
    ctx.fillStyle = "black";
    ctx.fillRect(
      this.coordinates.x, 
      this.coordinates.y, 
      this.size.width, 
      this.size.height)
  }
}