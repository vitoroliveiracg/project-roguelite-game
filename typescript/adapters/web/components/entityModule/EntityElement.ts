import FileHandler from "../../shared/FileHandler";

export default class EntityElement {
  public fileHandler:FileHandler
  public fileNames = {
    cssFileName: "styles/entityStyle.css",
    mainDivName: "entityPage.html"
  }
  public htmlElement:HTMLElement

  constructor () {
    this.fileHandler = new FileHandler()

    this.build()
  }

  draw () {

  }

  async build() {
    const elementHTMLText= await this.fileHandler.loadFileText( this.fileNames.mainDivName )
    const mainElement = document.createElement(elementHTMLText)
    this.htmlElement = mainElement
  }


  takeAction (text:string) {
    console.log(text)
  }

  get isTouching (element:HTMLElement) {
    const domRect1 = element.getBoundingClientRect();
    const domRect2 = this.htmlElement.getBoundingClientRect();
  
    return !(
      domRect1.top > domRect2.bottom ||
      domRect1.right < domRect2.left ||
      domRect1.bottom < domRect2.top ||
      domRect1.left > domRect2.right
    );

    /*

    this.size.height = Number(getComputedStyle(document.documentElement).getPropertyValue(this.size.heightName).replace('vh',''))
    this.size.width = Number(getComputedStyle(document.documentElement).getPropertyValue(this.size.widthName).replace('vw',''))

    if(this.positionTop <= (fishingHook.position.top + fishingHook.getCssHookHeight())
    && (this.positionTop + this.size.height) >= fishingHook.position.top
    && this.positionLeft <= (fishingHook.position.left + fishingHook.getCssHookWidth())
    && (this.positionLeft + this.size.width) >= fishingHook.position.left){
      return true
    }else{
      return false
    }*/
}