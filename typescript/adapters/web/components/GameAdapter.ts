/** @file Contém a classe GameAdapter, o orquestrador principal da camada de Adaptação (apresentação). */
import type { IEventManager } from "../../../domain/eventDispacher/IGameEvents";
import { logger } from "../shared/Logger";
import type { EntityRenderableState, IGameDomain } from "../../../domain/ports/domain-contracts";

import { initializeGame } from "./Game";

import Camera from "./cameraModule/Camera";
import Canvas from "./canvasModule/Canvas";
import WebGPURenderer from "./renderModule/WebGPURenderer";
import Renderer from "./renderModule/Renderer";
import type IRenderer from "./renderModule/IRenderer";
import GameMap from "./mapModule/Map";

import SceneManager from "./renderModule/SceneManager";
import UIManager from "./UiManager/UIManager";
import InputGateway from "./keyboardModule/InputGateway";

/** @class GameAdapter O "Adaptador" principal que conecta a lógica de domínio (`IGameDomain`) com as tecnologias da web (Canvas, Input, DOM), traduzindo eventos e dados entre as camadas e gerenciando o ciclo de vida dos componentes de apresentação. */
export default class GameAdapter {
  private readonly isDebugMode = false; /** @private Flag para controlar a renderização de elementos de depuração, como hitboxes. */
  private renderer!: IRenderer<any>; /** @private A instância do `Renderer` responsável por desenhar no canvas. */
  private camera!: Camera; /** @private A instância da `Camera` que controla a viewport do jogo. */
  private map?: GameMap; /** @private A instância do `GameMap` que gerencia o mapa de fundo, opcional. */
  
  private sceneManager!: SceneManager;
  private uiManager!: UIManager;
  private inputGateway!: InputGateway;
  
  /** @constructor @param domain Uma instância que implementa a interface do domínio. A injeção de dependência via interface permite que o Adapter seja agnóstico à implementação do domínio. */
  constructor(private domain: IGameDomain, private eventManager: IEventManager) {
    logger.log('init', 'GameAdapter instantiated.');
  }

  private isPaused: boolean = false;
  public togglePauseGame = (): void => {
    this.isPaused = !this.isPaused;
    logger.log('init', `Game paused state: ${this.isPaused}`);
  };

  //? ----------- Lifecycle -----------

  /** Fase de Inicialização: Orquestra a criação dos subsistemas da web (Canvas, Câmera, Renderer), carrega assets, informa o domínio sobre o mundo e inicia o game loop. @async @returns {Promise<void>} Resolve quando os assets essenciais são carregados. */
  public async initialize(){
    logger.log('init', 'GameAdapter initializing...');
    this.uiManager = new UIManager(
      this.togglePauseGame,
      (index: number) => this.domain.manageInventory('equip', { index }),
      (slot: string) => this.domain.manageInventory('unequip', { slot }),
      (action: 'unlock' | 'changeClass', payload: any) => this.domain.manageSkillTree(action, payload),
      (attribute: string) => this.domain.allocateAttribute(attribute),
      () => {
        logger.log('domain', 'Restarting game via UI command...');
        window.location.href = window.location.pathname; // Força recarregamento limpo escapando do Vite
      }
    );
    this.inputGateway = new InputGateway(this.domain);
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

    this.sceneManager = new SceneManager(this.renderer, this.isDebugMode);
    await this.sceneManager.initialize();

    logger.log('init', 'All assets preloaded.');
    this.syncScene();
    initializeGame(this.update.bind(this), this.draw.bind(this));
    
    window.dispatchEvent(new Event('resize'));
  }

  /** Fase de Update (Lógica do Adapter): Função principal do ciclo de vida, chamada a cada frame para processar inputs, delegar a atualização de lógica para o domínio, sincronizar o estado visual e atualizar a câmera. @private @param deltaTime O tempo em segundos desde o último frame. */
  private update(deltaTime: number): void {
    if (this.inputGateway.inputManager.consumeAction('toggle_attributes')) {
      this.uiManager.toggleCharacterMenu();
    }

    if (this.inputGateway.inputManager.consumeAction('toggle_skill_tree')) {
      this.uiManager.toggleSkillTree();
    }

    if (!this.isPaused) {
      this.handlePlayerInteractions();
      this.domain.update(deltaTime);
      this.sceneManager.updateAnimations(deltaTime);
    }

    this.syncScene();

    const playerState = this.domain.getRenderState().renderables.find(r => r.id === 1);
    this.uiManager.update(playerState);
  }

  /** Fase de Desenho: Função final do ciclo de vida, chamada a cada frame após o `update` para delegar a responsabilidade de desenhar o frame atual para o `Renderer`. */
  private async draw(): Promise<void> {
    logger.log('render', 'Drawing frame...');

    const domainState = this.domain.getRenderState();
    const cameraTarget = domainState.renderables.find(r => r.id === 1); // ID 1 é o jogador

    if (this.renderer instanceof WebGPURenderer) {
      // Lógica para WebGPU
      const renderablesWithAnimation = domainState.renderables.map(r => {
        const animManager = this.sceneManager.animationManagers.get(r.id);
        const animationData = animManager ? { currentFrame: animManager.currentFrame } : { currentFrame: 0 };
        return { ...r, ...animationData };
      });
      const webGpuDomainState = { world: domainState.world, renderables: renderablesWithAnimation };
      await this.renderer.drawFrame(webGpuDomainState, cameraTarget);
    } else {
      // Lógica para Canvas 2D
      const cameraTargetRenderable = cameraTarget ? this.sceneManager.renderables.get(cameraTarget.id) : undefined;
      if (cameraTargetRenderable) this.camera.setTarget(cameraTargetRenderable);

      this.renderer.clear();
      const allRenderables = [...this.sceneManager.renderables.values()];
      if (this.isDebugMode) allRenderables.push(...this.sceneManager.debugRenderables.values());

      // Passa a lista de objetos visuais (IRenderableObject) para o renderer antigo.
      const canvasDomainState = { world: domainState.world, renderables: allRenderables };
      await (this.renderer as Renderer).drawFrame(canvasDomainState, cameraTarget, this.map);
    }
  }

  //? ----------- Main Methods -----------

  private isReloading :boolean = false;
  private setupEventListeners(): void {
    this.eventManager.on('playerDied', () => {
      logger.log('domain', 'Player has died. Showing Game Over screen...');
      if(!this.isReloading){ 
        this.isPaused = true; // Congela as entidades no fundo
        this.inputGateway.inputManager.setPreventUnload(false); // Desativa o aviso antes de recarregar
        this.uiManager.showGameOver();

        // Fallback garantido: Pressione qualquer tecla ou clique para reiniciar
        // Atraso de 1.5 segundos para o jogador não pular a tela sem querer se estiver atacando alucinadamente
        setTimeout(() => {
          const forceRestart = () => { window.location.href = window.location.pathname; };
          window.addEventListener('keydown', forceRestart, { once: true });
          window.addEventListener('mousedown', forceRestart, { once: true });
        }, 1500);
      }
    });
  }

  /** Fase de Update (Sincronização): Compara o estado do domínio com os objetos visuais (`IRenderable`), criando/atualizando-os para refletir o estado atual do jogo. @private @async */
  private syncScene(): void {
    logger.log('sync', 'Syncing renderables...');
    const { renderables: domainStates } = this.domain.getRenderState();
    this.sceneManager.syncRenderables(domainStates);
  }

  /** Fase de Update (Input): Verifica as teclas atualmente pressionadas e traduz em chamadas para `domain.handlePlayerMovement`, passando o `deltaTime` para garantir um movimento consistente. @private @param deltaTime O tempo em segundos desde o último frame. */
  private handlePlayerInteractions(): void {
    this.inputGateway.handleInteractions((screenX, screenY) => this.screenToWorld(screenX, screenY));
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
    const playerRenderable = this.sceneManager.renderables.get(1);

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
