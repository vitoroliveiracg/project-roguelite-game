/** @file Implementa a fachada do domínio, o único ponto de entrada para a lógica de negócio do jogo. */
import type { ILogger } from "../ILogger";
import type { IGameDomain, RenderableState, EntityRenderableState, WorldState } from "../adapters/web/domain-contracts";

import Enemy from "./ObjectModule/Entities/Enemies/Enemy";
import Player from "./ObjectModule/Entities/Player/Player";
import World from "./World";

/** Define a estrutura de dados para a configuração inicial do domínio. */
interface DomainConfig {
  /** Configurações específicas do jogador. */
  player: { id: number; level: number; initialPos: { x: number; y: number } };
}

/** @class DomainFacade @implements {IGameDomain} Atua como o guardião e orquestrador da camada de domínio, implementando a porta `IGameDomain` para proteger a integridade das entidades internas e expor apenas operações de alto nível. */
export default class DomainFacade implements IGameDomain {
  private world!: World; /** @private A instância do `World` que representa o ambiente do jogo. */
  private player!: Player; /** @private A instância do `Player` que representa o jogador. */
  private config: DomainConfig; /** @private A configuração inicial do domínio. */
  private logger: ILogger; /** @private A instância do logger, injetada via construtor. */

  private rendables :RenderableState[] = []

  /** @constructor @param config O objeto de configuração com os dados iniciais para a criação das entidades do jogo. @param logger Uma instância de um logger que implementa a interface `ILogger`. */
  constructor(config: DomainConfig, logger: ILogger) {
    this.config = config;
    this.logger = logger;
    this.logger.log('init', 'DomainFacade instantiated.');
  }

  /** Fase de Inicialização: Cria as instâncias das entidades de domínio (`World`, `Player`) com base no contexto fornecido pelo Adapter. @param width A largura do mundo. @param height A altura do mundo. */
  public setWorld(width: number, height: number): void {
    this.logger.log('domain', `Setting world: ${width}x${height}`);
    this.world = new World(width, height);

    const { player: playerConfig } = this.config;
    this.player = new Player(playerConfig.id, playerConfig.level, playerConfig.initialPos, 10, 10, 10, 10, 10);

    const enemy = new Enemy(2, 1, {x: 0, y: 0}, 10, 10, 10, 10, 10);

    
    this.logger.log('domain', 'Player entity created:', this.player);
  }

  /** Fase de Update (Input): Processa um comando de movimento vindo do Adapter, delegando a execução para a entidade `Player`. @param command O objeto de comando vindo da camada de apresentação. @param deltaTime O tempo desde o último frame, usado para calcular o movimento. */
  public handlePlayerMovement(command: { direction: Array<'up' | 'down' | 'left' | 'right'> }, deltaTime: number): void {
    this.logger.log('input', 'Handling player movement in domain:', command);
    this.player.movePlayer(command.direction, this.world, deltaTime);
  }

  /** Fase de Update (Lógica): Avança o estado de todas as entidades do domínio. Chamado a cada frame pelo Adapter. @param deltaTime O tempo em segundos decorrido desde o último frame. */
  public update(deltaTime: number): void {
    this.logger.log('domain', `Update cycle (deltaTime: ${deltaTime})`);
    this.player.update(deltaTime);
  }

  /** Fase de Desenho (Coleta de Dados): Constrói e retorna uma representação em DTOs do estado atual do jogo para a camada de renderização. @throws {Error} Se o mundo não foi inicializado. @returns Um objeto com o estado do mundo e uma lista de DTOs renderizáveis. */
  public getRenderState(): { world: WorldState; renderables: readonly RenderableState[] } {
    this.logger.log('sync', 'DomainFacade getting render state...');
    if (!this.world) throw new Error("O mundo do domínio não foi inicializado. Chame setWorld() antes de getRenderState().");
    
    const playerRenderable: EntityRenderableState = {
      id: this.player.id, 
      entityTypeId: 'player',
      state: this.player.getState(),
      coordinates: this.player.coordinates, 
      size: this.player.size
    };
    
    return { world: { width: this.world.width, height: this.world.height }, renderables: [playerRenderable] };
  }
}