import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import type IRenderableObject from "./IRenderable";
import { RenderableFactory } from "./RenderableFactory";
import DebugCircle from "./DebugCircle";
import { AnimationManager } from "./AnimationManager";
import WebGPURenderer from "./WebGPURenderer";
import type IRenderer from "./IRenderer";

/** @class SceneManager Gerencia as instâncias visuais e a sincronização entre o estado do Domínio e as entidades gráficas na tela. */
export default class SceneManager {
  public renderables: Map<number, IRenderableObject> = new Map();
  public debugRenderables: Map<string, IRenderableObject> = new Map();
  public animationManagers: Map<number, AnimationManager> = new Map();
  private renderableFactory: RenderableFactory;

  constructor(private renderer: IRenderer<any>, private isDebugMode: boolean) {
    this.renderableFactory = new RenderableFactory();
  }

  public async initialize(): Promise<void> {
    await this.renderableFactory.preloadAssets();
  }

  public updateAnimations(deltaTime: number): void {
    for (const animManager of this.animationManagers.values()) {
      animManager.update(deltaTime);
    }
  }

  /** Compara o estado do domínio com os objetos visuais, criando/atualizando-os. */
  public syncRenderables(domainStates: readonly EntityRenderableState[]): void {
    const activeIds = new Set<number>();
    const activeDebugIds = new Set<string>();

    for (const state of domainStates) {
      activeIds.add(state.id);

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
          activeDebugIds.add(debugId);

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
        if (!activeIds.has(id)) this.animationManagers.delete(id);
      }
    } else {
      for (const id of this.renderables.keys()) {
        if (!activeIds.has(id)) this.renderables.delete(id);
      }
    }
    if (this.isDebugMode) {
      for (const id of this.debugRenderables.keys()) {
        if (!activeDebugIds.has(id)) this.debugRenderables.delete(id);
      }
    }
  }
}