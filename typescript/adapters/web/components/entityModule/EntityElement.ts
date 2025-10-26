import FileHandler from "../../shared/FileHandler";
import Vector2D from "../../shared/Vector2D";

export default class EntityElement {
  private fileHandler:FileHandler
  public fileNames = {
    cssFileName: "./styles/entityStyle.css",
    mainDivName: "./pages/entityPage.html"
  }
  private mainDivElement:HTMLElement = document.createElement('div') //Criado no build()

  public position = {
    posX: 0, // Posição do canto superior esquerdo (left)
    posY: 0, // Posição do canto superior esquerdo (top)
    centerPosX: 0,
    centerPosY: 0
  }

  public velocity: Vector2D = new Vector2D(0, 0);
  public direction: Vector2D = new Vector2D(0, 0);
  public speed:number = 10;

  constructor () {
    this.fileHandler = new FileHandler()

    this.build() 
  }

  draw (parentElement:HTMLElement) {
    parentElement.appendChild(this.mainDivElement)
  }

  kill (parentElement:HTMLElement) {
    parentElement.removeChild(this.mainDivElement)
  }

  async build() {
    const elementHTMLText = await this.fileHandler.loadFileText( this.fileNames.mainDivName )||''
    const elementStyleText = await this.fileHandler.loadFileText( this.fileNames.cssFileName )||'' 
    
    const tempDiv = document.createElement('div')
    
    tempDiv.style.position = 'absolute';
    tempDiv.style.cssText = elementStyleText
    tempDiv.innerHTML = elementHTMLText
    
    this.mainDivElement = tempDiv
    this.calculatePosition()
  }

  update() {
    const displacement: Vector2D = new Vector2D(this.direction.x * this.velocity.x, this.direction.y * this.velocity.y);
    displacement.normalize() // Testar, n sei se precisa
    displacement.multiply(this.speed)

    this.position.posX += displacement.x;
    this.position.posY += displacement.y;
    
    this.mainDivElement.style.left = `${this.position.posX}px`;
    this.mainDivElement.style.top = `${this.position.posY}px`;

    this.calculatePosition();
  }

  calculatePosition () {
    const rect = this.mainDivElement.getBoundingClientRect()
    this.position.posX = rect.left;
    this.position.posY = rect.top;
    this.position.centerPosX = (rect.left + rect.right) / 2
    this.position.centerPosY = (rect.top + rect.bottom) / 2
  }

  takeAction (text:string) {
    console.log(text)
  }

  isTouching (element:HTMLElement) {
    const domRect1 = element.getBoundingClientRect()
    const domRect2 = this.mainDivElement.getBoundingClientRect()
  
    return !(
      domRect1.top > domRect2.bottom ||
      domRect1.right < domRect2.left ||
      domRect1.bottom < domRect2.top ||
      domRect1.left > domRect2.right
    )
  }
}