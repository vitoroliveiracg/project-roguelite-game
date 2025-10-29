/** @file Contém a classe GameAdapter, o orquestrador principal da camada de Adaptação (apresentação). */
//* import { gameEvents } from "../../../domain/eventDispacher/eventDispacher";
import { logger } from "../shared/Logger"; 
import type { IGameDomain } from "../../../domain/ports/domain-contracts";

import { initializeGame } from "./Game";

import Camera from "./cameraModule/Camera";
import Canvas from "./canvasModule/Canvas";
import GameMap from "./mapModule/Map";
import Renderer from "./renderModule/Renderer";
import { InputManager } from "./keyboardModule/InputManager";

import type IRenderable from "./renderModule/IRenderable";
import { RenderableFactory } from "./renderModule/RenderableFactory";

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

  //? ----------- Lifecycle -----------
  /** Fase de Inicialização: Orquestra a criação dos subsistemas da web (Canvas, Câmera, Renderer), carrega assets, informa o domínio sobre o mundo e inicia o game loop. @async @returns {Promise<void>} Resolve quando os assets essenciais são carregados. */
  public async initialize(){
    logger.log('init', 'GameAdapter initializing...');
    this.inputManager = new InputManager();
    
    const canvas = new Canvas(document.body, 0, 0);
    this.setupResponsiveCanvas(canvas.element);
    
    const mapImageUrl = new URL('../assets/map.jpeg', import.meta.url).href;
    this.map = new GameMap(mapImageUrl);
    await this.map.waitUntilLoaded();
    
    const worldState = { width: this.map.width, height: this.map.height };
    this.domain.setWorld(worldState.width, worldState.height);
    logger.log('init', 'Domain world set with:', worldState);
    
    this.camera = new Camera(canvas, 3);
    
    this.renderer = new Renderer(canvas, this.camera);
    this.renderableFactory = new RenderableFactory();
    // Pré-carrega todos os assets e aguarda a conclusão ANTES de prosseguir.
    await this.renderableFactory.preloadAssets();
    logger.log('init', 'All assets preloaded.');
    
    this.syncRenderables(); // Sincroniza os renderizáveis pela primeira vez para criar o jogador e outros objetos iniciais.
    initializeGame(this.update.bind(this), this.draw.bind(this));
    
    window.dispatchEvent(new Event('resize'));
  }
  /** Fase de Update (Lógica do Adapter): Função principal do ciclo de vida, chamada a cada frame para processar inputs, delegar a atualização de lógica para o domínio, sincronizar o estado visual e atualizar a câmera. @private @param deltaTime O tempo em segundos desde o último frame. */
  private update(deltaTime: number): void { 
    this.handlePlayerInteractions(deltaTime);
    this.domain.update(deltaTime);
    this.syncRenderables();
  }
  /** Fase de Desenho: Função final do ciclo de vida, chamada a cada frame após o `update` para delegar a responsabilidade de desenhar o frame atual para o `Renderer`. */
  private draw(): void {
    logger.log('render', 'Drawing frame...');

    const { world } = this.domain.getRenderState();
    const playerRenderable = this.renderables.get(1);
    if (playerRenderable) this.camera.setTarget(playerRenderable);

    this.renderer.clear();
    
    this.renderer.drawFrame(this.map, world, Array.from(this.renderables.values()));//? Redesenha sempre todos os renderizaveis
  }

  //? ----------- Main Methods -----------
  /** Fase de Update (Sincronização): Compara o estado do domínio com os objetos visuais (`IRenderable`), criando/atualizando-os para refletir o estado atual do jogo. @private @async */
  private syncRenderables(): void {
    logger.log('sync', 'Syncing renderables...');
    
    const { renderables: domainStates } = this.domain.getRenderState();
    
    const activeIds = new Set<number>();

    for (const state of domainStates) {
      activeIds.add(state.id); //? Match id com o do domínio

      if (this.renderables.has(state.id)) {
        this.renderables.get(state.id)!.updateState(state);
      } else {
        const newRenderable = this.renderableFactory.create(state);
        if (newRenderable) { // Se um novo renderizável foi criado, adiciona-o ao mapa.
          this.renderables.set(state.id, newRenderable);
        }
      }
    }
  }
  /** Fase de Update (Input): Verifica as teclas atualmente pressionadas e traduz em chamadas para `domain.handlePlayerMovement`, passando o `deltaTime` para garantir um movimento consistente. @private @param deltaTime O tempo em segundos desde o último frame. */
  private handlePlayerInteractions(deltaTime: number): void {
    let actions: Array<'up' | 'down' | 'left' | 'right'> = []

    if (this.inputManager.isActionActive('move_up')) {
      logger.log("input", "(Game Adapter) handled direction move_up to player")
      actions.push("up")
    }

    if (this.inputManager.isActionActive('move_down')) {
      logger.log("input", "(Game Adapter) handled direction move_down to player")
      actions.push("down")
    }

    if (this.inputManager.isActionActive('move_left')) {
      logger.log("input", "(Game Adapter) handled direction move_left to player")
      actions.push("left")
    }

    if (this.inputManager.isActionActive('move_right')) {
      logger.log("input", "(Game Adapter) handled direction move_right to player")
      actions.push("right")
    }

    if (actions.length <= 0) return;
    
    logger.log('input', 'Input handling complete. Delegating to domain update...');
    this.domain.handlePlayerInteractions({ actions: actions }, deltaTime);
  }
  /** Fase de Inicialização: Configura o elemento Canvas para ocupar toda a tela e ser responsivo a redimensionamentos da janela. @private @param canvasElement O elemento canvas a ser estilizado. */
  private setupResponsiveCanvas(canvasElement: HTMLCanvasElement) {
    canvasElement.style.position = 'absolute'; // Posiciona o canvas de forma absoluta.
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
    canvasElement.style.width = '100vw';
    canvasElement.style.height = '100vh';
    canvasElement.style.display = 'block';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', () => { canvasElement.width = window.innerWidth; canvasElement.height = window.innerHeight; }); // Adiciona um listener para redimensionar o canvas quando a janela é redimensionada.
  }
}
