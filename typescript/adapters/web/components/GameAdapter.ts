/** @file Contém a classe GameAdapter, o orquestrador principal da camada de Adaptação (apresentação). */
import { gameEvents } from "../../../domain/eventDispacher/eventDispacher";
import { logger } from "../shared/Logger";
import type { EntityRenderableState, IGameDomain } from "../../../domain/ports/domain-contracts";

import { initializeGame } from "./Game";

import Camera from "./cameraModule/Camera";
import Canvas from "./canvasModule/Canvas";
import { InputManager } from "./keyboardModule/InputManager"; 

import type IRenderableObject from "./renderModule/IRenderable";
import { RenderableFactory } from "./renderModule/RenderableFactory";
import DebugCircle from "./renderModule/DebugCircle";
import XpBarGui from "../GUIS/xpBarHudModule/XpBarGui";
import type { action } from "../../../domain/eventDispacher/actions.type";
import WebGPURenderer, { type SpriteConfig } from "./renderModule/WebGPURenderer";
import Renderer from "./renderModule/Renderer";
import type IRenderer from "./renderModule/IRenderer";
import { AnimationManager } from "./renderModule/AnimationManager";
import GameMap from "./mapModule/Map";

/** @class GameAdapter O "Adaptador" principal que conecta a lógica de domínio (`IGameDomain`) com as tecnologias da web (Canvas, Input, DOM), traduzindo eventos e dados entre as camadas e gerenciando o ciclo de vida dos componentes de apresentação. */
export default class GameAdapter {
  private domain: IGameDomain;
  private readonly isDebugMode = false; /** @private Flag para controlar a renderização de elementos de depuração, como hitboxes. */
  private renderer!: IRenderer<any>; /** @private A instância do `Renderer` responsável por desenhar no canvas. */
  private camera!: Camera; /** @private A instância da `Camera` que controla a viewport do jogo. */
  private map?: GameMap; /** @private A instância do `GameMap` que gerencia o mapa de fundo, opcional. */
  private animationManagers: Map<number, AnimationManager> = new Map(); /** @private Gerencia o estado da animação para cada entidade. */
  private renderables: Map<number, IRenderableObject> = new Map(); /** @private Um mapa de objetos renderizáveis, indexados pelo ID da entidade de domínio. */
  private debugRenderables: Map<string, IRenderableObject> = new Map(); /** @private Um mapa para renderizáveis de depuração, como hitboxes. */
  private renderableFactory!: RenderableFactory; /** @private A fábrica para criar novos objetos `IRenderable`. */
  private inputManager!: InputManager; /** @private O gerenciador de input que traduz eventos brutos em ações de jogo. */
  private xpBarGui! :XpBarGui;
  
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
    this.xpBarGui = new XpBarGui();
    this.setupEventListeners();
    
    const canvas = new Canvas(document.body, 0, 0);
    this.setupResponsiveCanvas(canvas.element);
    
    this.camera = new Camera(canvas, 3);
    
    try {
      this.renderer = new WebGPURenderer(canvas);
      await this.renderer.initialize();
      // No modo WebGPU, o mapa é apenas uma textura no atlas, então definimos um tamanho fixo para o mundo.
      const worldState = { width: 1024, height: 1024 };
      this.domain.setWorld(worldState.width, worldState.height);
      logger.log('init', 'Successfully initialized WebGPU renderer.');
    } catch (error) {
      logger.log('error', `WebGPU initialization failed: ${(error as Error).message}. Falling back to Canvas 2D renderer.`);
      this.renderer = new Renderer(canvas, this.camera);
      await this.renderer.initialize(); // O initialize do Renderer antigo é síncrono, mas o await não causa problemas.

      // No modo Canvas 2D, carregamos o mapa de verdade para definir o tamanho do mundo.
      const mapImageUrl = new URL('../assets/maps/map.jpeg', import.meta.url).href;
      this.map = new GameMap(mapImageUrl);
      await this.map.waitUntilLoaded();
      const worldState = { width: this.map.width, height: this.map.height };
      this.domain.setWorld(worldState.width, worldState.height);
      logger.log('init', 'Initialized Canvas 2D renderer and loaded map.');
    }

    this.renderableFactory = new RenderableFactory();
    await this.renderableFactory.preloadAssets();
    logger.log('init', 'All assets preloaded.');
    this.syncRenderables();
    initializeGame(this.update.bind(this), this.draw.bind(this));
    
    window.dispatchEvent(new Event('resize'));
  }
  /** Fase de Update (Lógica do Adapter): Função principal do ciclo de vida, chamada a cada frame para processar inputs, delegar a atualização de lógica para o domínio, sincronizar o estado visual e atualizar a câmera. @private @param deltaTime O tempo em segundos desde o último frame. */
  private update(deltaTime: number): void {
    this.handlePlayerInteractions();
    this.domain.update(deltaTime);
    this.syncRenderables();

    // Atualiza a UI da barra de XP com os dados mais recentes do jogador.
    const playerState = this.domain.getRenderState().renderables.find(r => r.id === 1);
    if (playerState) {
      this.xpBarGui.update(playerState); // Agora é type-safe
    }

    for (const animManager of this.animationManagers.values()) {
      animManager.update(deltaTime); // O delta time do update é passado aqui
    }
  }
  /** Fase de Desenho: Função final do ciclo de vida, chamada a cada frame após o `update` para delegar a responsabilidade de desenhar o frame atual para o `Renderer`. */
  private async draw(): Promise<void> {
    logger.log('render', 'Drawing frame...');

    const domainState = this.domain.getRenderState();
    const cameraTarget = domainState.renderables.find(r => r.id === 1); // ID 1 é o jogador

    if (this.renderer instanceof WebGPURenderer) {
      // Lógica para WebGPU
      const renderablesWithAnimation = domainState.renderables.map(r => {
        const animManager = this.animationManagers.get(r.id);
        const animationData = animManager ? { currentFrame: animManager.currentFrame } : { currentFrame: 0 };
        return { ...r, ...animationData };
      });
      const webGpuDomainState = { world: domainState.world, renderables: renderablesWithAnimation };
      await this.renderer.drawFrame(webGpuDomainState, cameraTarget);
    } else {
      // Lógica para Canvas 2D
      const cameraTargetRenderable = cameraTarget ? this.renderables.get(cameraTarget.id) : undefined;
      if (cameraTargetRenderable) this.camera.setTarget(cameraTargetRenderable);

      this.renderer.clear();
      const allRenderables = [...this.renderables.values()];
      if (this.isDebugMode) allRenderables.push(...this.debugRenderables.values());

      // Passa a lista de objetos visuais (IRenderableObject) para o renderer antigo.
      const canvasDomainState = { world: domainState.world, renderables: allRenderables };
      await (this.renderer as Renderer).drawFrame(canvasDomainState, cameraTarget, this.map);
    }
  }

  //? ----------- Main Methods -----------
  private isReloading :boolean = false;
  private setupEventListeners(): void {
    gameEvents.on('playerDied', () => {
      logger.log('domain', 'Player has died. Reloading page...');
      if(!this.isReloading){ location.reload(); this.isReloading = true}
    });
  }
  /** Fase de Update (Sincronização): Compara o estado do domínio com os objetos visuais (`IRenderable`), criando/atualizando-os para refletir o estado atual do jogo. @private @async */
  private syncRenderables(deltaTime?: number): void {
    logger.log('sync', 'Syncing renderables...');
    
    const { renderables: domainStates } = this.domain.getRenderState();
    
    const activeIds = new Set<number>();
    const activeDebugIds = new Set<string>();

    for (const state of domainStates) {
      activeIds.add(state.id); //? Match id com o do domínio

      if (this.renderer instanceof WebGPURenderer) {
        // Sincroniza o gerenciador de animação para WebGPU
        if (this.animationManagers.has(state.id)) {
          const config = this.renderer.getSpriteConfig(state.entityTypeId, state.state);
          if (config) {
            this.animationManagers.get(state.id)!.setConfig(config);
          }
        } else {
          const config = this.renderer.getSpriteConfig(state.entityTypeId, state.state);
          if (config) {
            this.animationManagers.set(state.id, new AnimationManager(config));
          }
        }
      } else {
        // Sincroniza os objetos IRenderable para o Canvas 2D
        if (this.renderables.has(state.id)) {
          this.renderables.get(state.id)!.updateState(state);
        } else {
          const newRenderable = this.renderableFactory.create(state);
          if (newRenderable) {
            this.renderables.set(state.id, newRenderable);
          }
        }
      }

      // Sincroniza os renderizáveis de depuração (hitboxes)
      if (this.isDebugMode) {
        state.hitboxes?.forEach((hitboxState, index) => {
          const debugId = `${state.id}-hitbox-${index}`;
          activeDebugIds.add(debugId);
  
          if (this.debugRenderables.has(debugId)) {
            this.debugRenderables.get(debugId)!.updateState(hitboxState);
          } else {
            if (hitboxState.type === 'circle') {
              this.debugRenderables.set(debugId, new DebugCircle(state.id, hitboxState));
            }
            // TODO: Adicionar lógica para 'polygon' aqui se necessário
          }
        });
      }
    }

    // Remove os objetos visuais que não estão mais no domínio
    if (this.renderer instanceof WebGPURenderer) {
      for (const id of this.animationManagers.keys()) {
        if (!activeIds.has(id)) this.animationManagers.delete(id);
      }
    } else {
      for (const id of this.renderables.keys()) {
        if (!activeIds.has(id)) {
          this.renderables.delete(id);
        }
      }
    }
    if (this.isDebugMode) {
      for (const id of this.debugRenderables.keys()) {
        if (!activeDebugIds.has(id)) {
          this.debugRenderables.delete(id);
        }
      }
    }
  }
  /** Fase de Update (Input): Verifica as teclas atualmente pressionadas e traduz em chamadas para `domain.handlePlayerMovement`, passando o `deltaTime` para garantir um movimento consistente. @private @param deltaTime O tempo em segundos desde o último frame. */
  private handlePlayerInteractions(): void {
    let actions: Array<action> = []

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

    if (this.inputManager.isActionActive('shift')) {
      logger.log("input", "(Game Adapter) handled direction shift to player")
      actions.push("shift")
    }

    if (this.inputManager.isActionActive('mouse_left')) {
      logger.log("input", "(Game Adapter) handled left mouse click to player")
      actions.push("leftClick")
    }

    if (this.inputManager.isActionActive('mouse_middle')) {
      logger.log("input", "(Game Adapter) handled middle mouse click to player")
      actions.push("scrollClick")
    }

    if (this.inputManager.isActionActive('mouse_right')) {
      logger.log("input", "(Game Adapter) handled right mouse click to player")
      actions.push("rightClick")
    }
    
    if (actions.length <= 0) return;

    let mouseWorldCoordinates: { x: number, y: number } = { x: 0, y: 0 };
    if ( actions.some( action => this.inputManager.clickActions.has( action ) ) ) {
        const screenX = this.inputManager.mouseLastCoordinates.x;
        const screenY = this.inputManager.mouseLastCoordinates.y;
        
        mouseWorldCoordinates = this.screenToWorld(screenX, screenY);
    }

    logger.log('input', 'Input handling complete. Delegating to domain update...');
    this.domain.handlePlayerInteractions(
        { actions: actions }, 
        mouseWorldCoordinates);
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
  /** * Converte as coordenadas de clique da tela (pixels do canvas) para as coordenadas do mundo do jogo. * @param screenX Coordenada X do clique (e.g., event.clientX). * @param screenY Coordenada Y do clique (e.g., event.clientY). * @returns Um objeto com as coordenadas do mundo { worldX, worldY }. */
  private screenToWorld(screenX: number, screenY: number): { x: number, y: number } {

    const zoom = this.camera.zoom;
    const { world } = this.domain.getRenderState();
    const playerRenderable = this.renderables.get(1);

    // Define um alvo padrão se o jogador não existir, evitando duplicação de código.
    const target = playerRenderable 
        ? { coordinates: playerRenderable.coordinates, size: playerRenderable.size }
        : { coordinates: { x: 0, y: 0 }, size: { width: 0, height: 0 } };

    const viewWidth = this.renderer.canvas.element.width / zoom;
    const viewHeight = this.renderer.canvas.element.height / zoom;

    const camX = (target.coordinates.x + target.size.width / 2) - viewWidth / 2;
    const camY = (target.coordinates.y + target.size.height / 2) - viewHeight / 2;

    const clampedCamX = Math.max(0, Math.min(camX, world.width - viewWidth));
    const clampedCamY = Math.max(0, Math.min(camY, world.height - viewHeight));
    
    return { x: (screenX / zoom) + clampedCamX, y: (screenY / zoom) + clampedCamY };
  }
}
