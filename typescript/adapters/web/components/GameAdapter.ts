/** @file Contém a classe GameAdapter, o orquestrador principal da camada de Adaptação (apresentação). */
import { gameEvents } from "../../../domain/eventDispacher/eventDispacher";
import { logger } from "../shared/Logger"; 
import type { IGameDomain } from "../domain-contracts";
import { initializeGame } from "./Game";
import Camera from "./cameraModule/Camera";
import Canvas from "./canvasModule/Canvas";
import GameMap from "./mapModule/Map";
import Renderer from "./renderModule/Renderer";
import type IRenderable from "./renderModule/IRenderable";
import { RenderableFactory } from "./renderModule/RenderableFactory";
import { InputManager } from "./keyboardModule/InputManager";

/** @class GameAdapter O "Adaptador" principal que conecta a lógica de domínio (`IGameDomain`) com as tecnologias da web (Canvas, Input, DOM), traduzindo eventos e dados entre as camadas e gerenciando o ciclo de vida dos componentes de apresentação. */
export default class GameAdapter {
  private domain: IGameDomain;
  private renderer!: Renderer; /** @private A instância do `Renderer` responsável por desenhar no canvas. */
  private map!: GameMap; /** @private A instância do `GameMap` que gerencia o mapa de fundo. */
  private camera!: Camera; /** @private A instância da `Camera` que controla a viewport do jogo. */
  private renderables: Map<number, IRenderable> = new Map(); /** @private Um mapa de objetos renderizáveis, indexados pelo ID da entidade de domínio. */
  private renderableFactory!: RenderableFactory; /** @private A fábrica para criar novos objetos `IRenderable`. */
  private inputManager!: InputManager; /** @private O gerenciador de input que traduz eventos brutos em ações de jogo. */

  /** @constructor @param domain Uma instância que implementa a interface do domínio. A injeção de dependência via interface permite que o Adapter seja agnóstico à implementação do domínio. */
  constructor(domain: IGameDomain) {
    logger.log('init', 'GameAdapter instantiated.');
    this.domain = domain;
  }

  /** Fase de Inicialização: Orquestra a criação dos subsistemas da web (Canvas, Câmera, Renderer), carrega assets, informa o domínio sobre o mundo e inicia o game loop. @async @returns {Promise<void>} Resolve quando os assets essenciais são carregados. */
  public async initialize(){
    logger.log('init', 'GameAdapter initializing...');
    this.inputManager = new InputManager(); // Cria o gerenciador de input.
    
    const canvas = new Canvas(document.body, 0, 0); // Cria a instância do Canvas, inicialmente com 0x0 para ser redimensionado.
    this.setupResponsiveCanvas(canvas.element); // Configura o canvas para ser responsivo ao tamanho da janela.
    
    const mapImageUrl = new URL('../assets/map.jpeg', import.meta.url).href; // Obtém a URL da imagem do mapa de forma robusta.
    this.map = new GameMap(mapImageUrl); // Cria a instância do mapa.
    await this.map.waitUntilLoaded(); // Aguarda o carregamento da imagem do mapa.
    
    const worldState = { width: this.map.width, height: this.map.height }; // Obtém as dimensões do mundo a partir do mapa carregado.
    this.domain.setWorld(worldState.width, worldState.height); // Informa o domínio sobre as dimensões do mundo.
    logger.log('init', 'Domain world set with:', worldState);
    
    this.camera = new Camera(canvas, 3); // Cria a câmera com um zoom inicial de 3x.
    
    this.renderer = new Renderer(canvas, this.camera); // Cria o renderer, injetando o canvas e a câmera.
    this.renderableFactory = new RenderableFactory(); // Cria a fábrica de renderizáveis.
    
    await this.syncRenderables(); // Sincroniza os renderizáveis pela primeira vez para criar o jogador e outros objetos iniciais.
    initializeGame(this.update.bind(this), this.draw.bind(this)); // Inicia o game loop, passando os métodos de update e draw.
    
    window.dispatchEvent(new Event('resize')); // Dispara um evento de resize para garantir que o canvas se ajuste corretamente na inicialização.
  }
  
  /** Fase de Update (Sincronização): Compara o estado do domínio com os objetos visuais (`IRenderable`), criando/atualizando-os para refletir o estado atual do jogo. @private @async */
  private async syncRenderables(): Promise<void> {
    logger.log('sync', 'Syncing renderables...');
    
    const { renderables: domainStates } = this.domain.getRenderState();
    
    const activeIds = new Set<number>();
    const loadingPromises: Promise<void>[] = [];

    for (const state of domainStates) {
      activeIds.add(state.id); //? Match id com o do domínio

      if (this.renderables.has(state.id)) {
        this.renderables.get(state.id)!.updateState(state);
        logger.log('sync', `Updated renderable ID: ${state.id}`);
      } 
      else {
        const newRenderable = this.renderableFactory.create(state) as any; // Cast to access waitUntilLoaded
        if (newRenderable) { // Se um novo renderizável foi criado, adiciona-o ao mapa e, se tiver, aguarda seu carregamento.
          this.renderables.set(state.id, newRenderable);
          if (newRenderable.waitUntilLoaded) {
            loadingPromises.push(newRenderable.waitUntilLoaded());
          }
        }
      }
    }
    await Promise.all(loadingPromises);
  }

  /** Fase de Update (Lógica do Adapter): Função principal do ciclo de vida, chamada a cada frame para processar inputs, delegar a atualização de lógica para o domínio, sincronizar o estado visual e atualizar a câmera. @private @param deltaTime O tempo em segundos desde o último frame. */
  private update(deltaTime: number): void { 
    this.handleMovement(deltaTime); // Processa as teclas pressionadas e envia comandos ao domínio.
    this.domain.update(deltaTime); // Delega a atualização da lógica de negócio para o domínio.
    this.syncRenderables(); // Sincroniza os objetos visuais com o estado mais recente do domínio.
    const playerRenderable = this.renderables.get(1); // Obtém o objeto renderizável do jogador.
    logger.log('camera', 'Player renderable found, setting camera target.');
    if (playerRenderable) this.camera.setTarget(playerRenderable); // Se o jogador existe, define-o como alvo da câmera.
  }

  /** Fase de Desenho: Função final do ciclo de vida, chamada a cada frame após o `update` para delegar a responsabilidade de desenhar o frame atual para o `Renderer`. */
  private draw(): void {
    logger.log('render', 'Drawing frame...');
    const { world } = this.domain.getRenderState(); // Obtém o estado do mundo do domínio.
    this.renderer.clear(); // Limpa o canvas.
    this.renderer.drawFrame(this.map, world, Array.from(this.renderables.values())); // Desenha o frame completo, incluindo mapa e todos os objetos renderizáveis.
  }



  /** Fase de Update (Input): Verifica as teclas atualmente pressionadas e traduz em chamadas para `domain.handlePlayerMovement`, passando o `deltaTime` para garantir um movimento consistente. @private @param deltaTime O tempo em segundos desde o último frame. */
  private handleMovement(deltaTime: number): void {
    
    // if (this.inputManager.isActionActive('move_up')) {
    //   logger.log("input", "(Game Adapter) handled direction move_up to player")
    //   this.domain.handlePlayerMovement({ direction: 'up' }, deltaTime);
    // }
    // if (this.inputManager.isActionActive('move_down')) {
    //   logger.log("input", "(Game Adapter) handled direction move_down to player")
    //   this.domain.handlePlayerMovement({ direction: 'down' }, deltaTime);
    // }
    // if (this.inputManager.isActionActive('move_left')) {
    //   logger.log("input", "(Game Adapter) handled direction move_left to player")
    //   this.domain.handlePlayerMovement({ direction: 'left' }, deltaTime);
    // }
    // if (this.inputManager.isActionActive('move_right')) {
    //   logger.log("input", "(Game Adapter) handled direction move_right to player")
    //   this.domain.handlePlayerMovement({ direction: 'right' }, deltaTime);
    // }

    let directions: Array<'up' | 'down' | 'left' | 'right'> = []

    if (this.inputManager.isActionActive('move_up')) {
      logger.log("input", "(Game Adapter) handled direction move_up to player")
      directions.push("up")
      // this.domain.handlePlayerMovement({ direction: 'up' }, deltaTime);
    }

    if (this.inputManager.isActionActive('move_down')) {
      logger.log("input", "(Game Adapter) handled direction move_down to player")
      directions.push("down")
      // this.domain.handlePlayerMovement({ direction: 'down' }, deltaTime);
    }

    if (this.inputManager.isActionActive('move_left')) {
      logger.log("input", "(Game Adapter) handled direction move_left to player")
      directions.push("left")
      // this.domain.handlePlayerMovement({ direction: 'left' }, deltaTime);
    }

    if (this.inputManager.isActionActive('move_right')) {
      logger.log("input", "(Game Adapter) handled direction move_right to player")
      directions.push("right")
    }
    logger.log('input', 'Input handling complete. Delegating to domain update...');
  
    this.domain.handlePlayerMovement({ direction: directions }, deltaTime);
  }


  /** Dispara um evento de log para fins de depuração. @private */

  /** Fase de Inicialização: Configura o elemento Canvas para ocupar toda a tela e ser responsivo a redimensionamentos da janela. @private @param canvasElement O elemento canvas a ser estilizado. */
  private setupResponsiveCanvas(canvasElement: HTMLCanvasElement) {
    canvasElement.style.position = 'absolute'; // Posiciona o canvas de forma absoluta.
    canvasElement.style.top = '0'; // Alinha o canvas ao topo.
    canvasElement.style.left = '0'; // Alinha o canvas à esquerda.
    canvasElement.style.width = '100vw'; // Faz o canvas ocupar 100% da largura da viewport.
    canvasElement.style.height = '100vh'; // Faz o canvas ocupar 100% da altura da viewport.
    canvasElement.style.display = 'block'; // Garante que o canvas seja um elemento de bloco.
    document.body.style.margin = '0'; // Remove a margem padrão do corpo do documento.
    document.body.style.overflow = 'hidden'; // Esconde as barras de rolagem do corpo do documento.
    window.addEventListener('resize', () => { canvasElement.width = window.innerWidth; canvasElement.height = window.innerHeight; }); // Adiciona um listener para redimensionar o canvas quando a janela é redimensionada.
  }
}
