/**
 * DTOs (Data Transfer Objects) que definem a estrutura de dados
 * que cruza a fronteira entre a aplicação e a apresentação.
 */
export interface WorldState {
  width: number;
  height: number;
}

interface BaseRenderableState {
  id: number;
  coordinates: { x: number; y: number };
  size: { width: number; height: number };
}

export interface EntityRenderableState extends BaseRenderableState {
  entityTypeId: string; // Ex: 'player', 'goblin', 'chest'
  state: string; // Ex: 'idle', 'walking', 'attacking', 'open'
}

export type RenderableState = EntityRenderableState; // Por enquanto, só temos entidades
/**
 * Define o contrato que o domínio deve seguir para ser consumido pelo GameAdapter.
 * A camada de apresentação depende desta abstração, não de implementações concretas.
 */
export interface IGameDomain {
  update(deltaTime: number): void;
  setWorld(width: number, height: number): void;
  handlePlayerMovement(command: { direction: 'up' | 'down' | 'left' | 'right' }): void;
  getRenderState(): { world: WorldState; renderables: readonly RenderableState[] };
}