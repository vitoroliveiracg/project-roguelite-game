import type { EntityRenderableState } from "../../../../../domain/ports/domain-contracts";
import type IRenderableObject from "../visuals/IRenderable";
import { RenderableFactory } from "./RenderableFactory";
import DebugCircle from "../customRenderables/DebugCircle";
import { AnimationManager } from "../visuals/AnimationManager";
import WebGPURenderer from "../engine/WebGPURenderer";
import type IRenderer from "../engine/IRenderer";

/** @class SceneManager Gerencia as instâncias visuais e a sincronização entre o estado do Domínio e as entidades gráficas na tela. */
export default class SceneManager {
  public renderables: Map<number, IRenderableObject> = new Map();
  public debugRenderables: Map<string, IRenderableObject> = new Map();
  public animationManagers: Map<number, AnimationManager> = new Map();
  private activeIds = new Set<number>();
  private activeDebugIds = new Set<string>();
  private renderableFactory: RenderableFactory;
  
  public transientVisuals: Map<string, { state: EntityRenderableState, renderable?: IRenderableObject, animationManager?: AnimationManager, timeRemaining: number }> = new Map();
  private nextTransientId: number = -1;

  constructor(private renderer: IRenderer<any>, private isDebugMode: boolean) {
    this.renderableFactory = new RenderableFactory();
  }

  public async initialize(): Promise<void> {
    await this.renderableFactory.preloadAssets();
  }

  public setDebugMode(debug: boolean): void {
    this.isDebugMode = debug;
    if (!debug) {
      this.debugRenderables.clear();
      this.activeDebugIds.clear();
    }
  }

  public updateAnimations(deltaTime: number): void {
    for (const animManager of this.animationManagers.values()) {
      animManager.update(deltaTime);
    }

    for (const [id, visual] of this.transientVisuals.entries()) {
      visual.timeRemaining -= deltaTime;
      if (visual.timeRemaining <= 0) {
        this.transientVisuals.delete(id);
      } else if (visual.animationManager) {
        visual.animationManager.update(deltaTime);
      }
    }
  }

  public addVisualEffect(payload: { type: string, coordinates: {x:number, y:number}, duration: number, size: {width:number, height:number} }): void {
    const state: EntityRenderableState = {
      id: this.nextTransientId--, // Mock ID negativo para não colidir com entidades reais
      entityTypeId: payload.type,
      coordinates: payload.coordinates,
      size: payload.size,
      rotation: 0,
      state: 'active'
    };

    const transientData: any = { state, timeRemaining: payload.duration };

    if (this.renderer instanceof WebGPURenderer) {
      const config = this.renderer.getSpriteConfig(state.entityTypeId, state.state);
      if (config) {
        transientData.animationManager = new AnimationManager(config);
      }
    } else {
      const renderable = this.renderableFactory.create(state);
      if (renderable) {
        transientData.renderable = renderable;
      }
    }

    this.transientVisuals.set(`vfx_${state.id}`, transientData);
  }

  /** Compara o estado do domínio com os objetos visuais, criando/atualizando-os. */
  public syncRenderables(domainStates: readonly EntityRenderableState[]): void {
    this.activeIds.clear();
    this.activeDebugIds.clear();

    for (const state of domainStates) {
      this.activeIds.add(state.id);

      if (this.renderer instanceof WebGPURenderer) {
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
        if (this.renderables.has(state.id)) {
          this.renderables.get(state.id)!.updateState(state);
        } else {
          const newRenderable = this.renderableFactory.create(state);
          if (newRenderable) {
            this.renderables.set(state.id, newRenderable);
          }
        }
      }

      if (this.isDebugMode) {
        state.hitboxes?.forEach((hitboxState, index) => {
          const debugId = `${state.id}-hitbox-${index}`;
          this.activeDebugIds.add(debugId);

          if (this.debugRenderables.has(debugId)) {
            this.debugRenderables.get(debugId)!.updateState(hitboxState);
          } else {
            if (hitboxState.type === 'circle') {
              this.debugRenderables.set(debugId, new DebugCircle(state.id, hitboxState));
            }
          }
        });
      }
    }

    if (this.renderer instanceof WebGPURenderer) {
      for (const id of this.animationManagers.keys()) {
        if (!this.activeIds.has(id)) this.animationManagers.delete(id);
      }
    } else {
      for (const id of this.renderables.keys()) {
        if (!this.activeIds.has(id)) this.renderables.delete(id);
      }
    }
    if (this.isDebugMode) {
      for (const id of this.debugRenderables.keys()) {
        if (!this.activeDebugIds.has(id)) this.debugRenderables.delete(id);
      }
    }
  }
}