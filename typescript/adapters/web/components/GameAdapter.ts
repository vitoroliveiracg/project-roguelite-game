import { gameEvents } from "../../../domain/eventDispacher/eventDispacher";
import type { IGameDomain } from "../domain-contracts";

import { initializeGame } from "./Game";
import Camera from "./cameraModule/Camera";
import Canvas from "./canvasModule/Canvas";
import GameMap from "./mapModule/Map";
import Renderer from "./renderModule/Renderer";
import type IRenderable from "./renderModule/IRenderable";
import { RenderableFactory } from "./renderModule/RenderableFactory";

export default class GameAdapter {
  private domain: IGameDomain;

  private renderer! :Renderer;
  private map! :GameMap;
  private camera! :Camera;
  private pressedKeys: Set<string> = new Set();

  private renderables: Map<number, IRenderable> = new Map();
  private renderableFactory!: RenderableFactory;

  constructor(domain: IGameDomain) {
    this.domain = domain;
  }

  public async initialize(){
    this.handleEvents();

    // O canvas agora começa com tamanho 0 e será redimensionado.
    const canvas = new Canvas(document.body, 0, 0);
    // Adiciona CSS para fazer o canvas ocupar a tela toda.
    this.setupResponsiveCanvas(canvas.element);
    
    // Corrigido: Usamos o construtor `new URL(...)` com `import.meta.url`.
    // Esta é a forma mais robusta de garantir que o Vite (ou outro bundler)
    // encontre o asset relativo ao arquivo atual e forneça a URL pública correta.
    const mapImageUrl = new URL('../assets/map.jpeg', import.meta.url).href;
    this.map = new GameMap(mapImageUrl);
    await this.map.waitUntilLoaded();

    // O tamanho do mundo agora é definido pelo tamanho da imagem do mapa.
    const worldState = { width: this.map.width, height: this.map.height };

    // Inicializa o domínio e a câmera com o tamanho correto do mundo.
    this.domain.setWorld(worldState.width, worldState.height);

    // A câmera precisa do estado do mundo, que obtemos do domínio.
    this.camera = new Camera(canvas, 3); // Aumentando o zoom para 4x
    
    this.renderer = new Renderer(canvas, this.camera);
    this.renderableFactory = new RenderableFactory();
    
    // Sincroniza os renderizáveis pela primeira vez para criar o jogador
    await this.syncRenderables();

    initializeGame(
      this.update.bind(this),
      this.draw.bind(this)
    );

    // Força o primeiro redimensionamento.
    window.dispatchEvent(new Event('resize'));
  }
  
  private async syncRenderables(): Promise<void> {
    const { renderables: domainStates } = this.domain.getRenderState();
    const activeIds = new Set<number>();
    const loadingPromises: Promise<void>[] = [];

    for (const state of domainStates) {
      activeIds.add(state.id);
      if (this.renderables.has(state.id)) {
        this.renderables.get(state.id)!.updateState(state);
      } else {
        const newRenderable = this.renderableFactory.create(state) as any; // Cast to access waitUntilLoaded
        if (newRenderable) {
          this.renderables.set(state.id, newRenderable);
          if (newRenderable.waitUntilLoaded) {
            loadingPromises.push(newRenderable.waitUntilLoaded());
          }
        }
      }
    }
    await Promise.all(loadingPromises);
  }

  private update(deltaTime: number): void { 
    this.handleMovement();

    this.domain.update(deltaTime); 

    // O syncRenderables pode continuar sendo chamado sem await no loop principal,
    // pois o carregamento inicial já foi garantido no initialize.
    this.syncRenderables();
    
    // Corrigido: Obtém o objeto IRenderable (Sprite) do mapa gerenciado pelo adapter,
    // não o DTO do domínio.
    const playerRenderable = this.renderables.get(1);
    if (playerRenderable) this.camera.setTarget(playerRenderable);
  }

  private draw(): void {
    const { world, renderables: domainStates } = this.domain.getRenderState();
    this.renderer.clear();
    // Passa a lista de objetos IRenderable (os valores do Map) para o renderer.
    // Isso garante que cada objeto tenha o método .draw().
    this.renderer.drawFrame(this.map, world, Array.from(this.renderables.values()));
  }

  private handleEvents(){

    gameEvents.on("messageReceived", parameters=>{
      console.log("messageReceived:", parameters.message);
    })

    // Adiciona listeners para eventos de teclado para capturar a entrada do jogador.
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      console.log(`[Input] Key down: ${key}`); // DEBUG: Confirma a captura da tecla.
      this.pressedKeys.add(key);

      // Gatilho para o evento de log com a tecla 'l'.
      if (key === 'l') this.logDrawKey();
    });
    window.addEventListener('keyup', (e) => this.pressedKeys.delete(e.key.toLowerCase()));

  }

  /**
   * Verifica as teclas pressionadas a cada frame e envia os comandos
   * de movimento para o domínio.
   */
  private handleMovement(): void {
    if (this.pressedKeys.has('w')) {
      console.log("[Adapter] Sending 'up' command to domain."); // DEBUG
      this.domain.handlePlayerMovement({ direction: 'up' });
    }
    if (this.pressedKeys.has('s')) {
      console.log("[Adapter] Sending 'down' command to domain."); // DEBUG
      this.domain.handlePlayerMovement({ direction: 'down' });
    }
    if (this.pressedKeys.has('a')) {
      console.log("[Adapter] Sending 'left' command to domain."); // DEBUG
      this.domain.handlePlayerMovement({ direction: 'left' });
    }
    if (this.pressedKeys.has('d')) {
      console.log("[Adapter] Sending 'right' command to domain."); // DEBUG
      this.domain.handlePlayerMovement({ direction: 'right' });
    }
  }

  public keyPressed (key:string) {
  }

  private logDrawKey () {
    gameEvents.dispatch("log", {})
  }

  private setupResponsiveCanvas(canvasElement: HTMLCanvasElement) {
    canvasElement.style.position = 'absolute';
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
    canvasElement.style.width = '100vw';
    canvasElement.style.height = '100vh';
    canvasElement.style.display = 'block';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    window.addEventListener('resize', () => {
      // Atualiza a resolução interna do canvas para corresponder ao seu novo tamanho.
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
    });
  }

}
