import type { IGameDomain, RenderableState, EntityRenderableState, WorldState } from "../adapters/web/domain-contracts";
import Player from "./entities/Player";
import World from "./entities/World";

/**
 * Implementa o contrato IGameDomain e atua como a única porta de entrada
 * para a camada de domínio. Encapsula toda a lógica de negócio e estado.
*/
interface DomainConfig {
  player: { id: number; level: number; initialPos: { x: number; y: number } };
}

export default class DomainFacade implements IGameDomain {
  private world!: World;
  private player!: Player;
  private config: DomainConfig;

  constructor(config: DomainConfig) {
    // Apenas armazena a configuração. A inicialização real é adiada.
    this.config = config;
  }

  // Permite que a camada de apresentação defina o mundo depois que os assets forem carregados.
  public setWorld(width: number, height: number): void {
    this.world = new World(width, height);
    // Agora que o mundo existe, podemos criar o jogador com segurança.
    const { player: playerConfig } = this.config;
    this.player = new Player(playerConfig.id, playerConfig.level, playerConfig.initialPos, 10, 10, 10, 10, 10);
  }

  public handlePlayerMovement(command: { direction: 'up' | 'down' | 'left' | 'right' }): void {
    const oldCoords = { ...this.player.coordinates };
    console.log(`[Domain] Received move command: '${command.direction}'. Old Coords: (${oldCoords.x}, ${oldCoords.y})`); // DEBUG
    this.player.move(command.direction, this.world);
    console.log(`[Domain] New Coords: (${this.player.coordinates.x}, ${this.player.coordinates.y})`); // DEBUG
  }

  public update(deltaTime: number): void {
  }

  public getRenderState(): { world: WorldState; renderables: readonly RenderableState[] } {
    if (!this.world) throw new Error("O mundo do domínio não foi inicializado. Chame setWorld() antes de getRenderState().");
    
    const playerRenderable: EntityRenderableState = {
      id: this.player.id, 
      entityTypeId: 'player', // O domínio apenas identifica o tipo de entidade
      state: 'idle', // E o seu estado atual
      coordinates: this.player.coordinates, 
      size: this.player.size // O tamanho agora vem diretamente da entidade Player.
    };
    
    return { world: { width: this.world.width, height: this.world.height }, renderables: [playerRenderable] };
  }
}