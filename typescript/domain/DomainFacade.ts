/** @file Implementa a fachada do domínio, o único ponto de entrada para a lógica de negócio do jogo. */
import type { ILogger } from "./ports/ILogger";
import type { IGameDomain, RenderableState, WorldState } from "./ports/domain-contracts";

import Player from "./ObjectModule/Entities/Player/Player";
import ObjectElementManager from "./ObjectModule/ObjectElementManager";
import World from "./World";
import Atributes from "./ObjectModule/Entities/Atributes";
import { gameEvents } from "./eventDispacher/eventDispacher";
import type IXPTable from "./ObjectModule/Entities/IXPTable";

/** Define a estrutura de dados para a configuração inicial do domínio. */
interface DomainConfig {
  /** Configurações específicas do jogador. */
  player: { id: number; level: number; initialPos: { x: number; y: number } };
}

/** @class DomainFacade @implements {IGameDomain} Atua como o guardião e orquestrador da camada de domínio, implementando a porta `IGameDomain` para proteger a integridade das entidades internas e expor apenas operações de alto nível. */
export default class DomainFacade implements IGameDomain {
  private world!: World; /** @private A instância do `World` que representa o ambiente do jogo. */
  private player!: Player; /** @private A instância do `Player` que representa o jogador. */
  private objectManager!: ObjectElementManager; /** @private O gerenciador de todas as outras entidades dinâmicas (inimigos, itens, etc.). */
  private config: DomainConfig; /** @private A configuração inicial do domínio. */
  private logger: ILogger; /** @private A instância do logger, injetada via construtor. */
  private xpTable: IXPTable; /** @private A tabela de progressão de XP. */

  /** @constructor @param config O objeto de configuração com os dados iniciais para a criação das entidades do jogo. @param logger Uma instância de um logger que implementa a interface `ILogger`. */
  constructor(config: DomainConfig, logger: ILogger) {
    this.config = config;
    this.logger = logger;
    this.logger.log('init', 'DomainFacade instantiated.');

    // Define a curva de XP do jogo. Ex: Nv2=100XP, Nv3=120XP, Nv4=144XP...
    this.xpTable = { fixedBase: 100, levelScale: 1.2 };

    // Registra o listener para o evento de morte de inimigo.
    this.setupEventListeners();
  }


  /** Fase de Update (Lógica): Avança o estado de todas as entidades do domínio. Chamado a cada frame pelo Adapter. @param deltaTime O tempo em segundos decorrido desde o último frame. */
  public update(deltaTime: number): void {
    this.logger.log('domain', `Update cycle started (deltaTime: ${deltaTime})`);
    
    this.player.update(deltaTime);
    this.objectManager.updateAll(deltaTime);
  }

  /** Fase de Inicialização: Cria as instâncias das entidades de domínio (`World`, `Player`) com base no contexto fornecido pelo Adapter. @param width A largura do mundo. @param height A altura do mundo. */
  public setWorld(width: number, height: number): void {
    this.logger.log('domain', `Setting world: ${width}x${height}`);
    this.world = new World(width, height);
    
    this.objectManager = new ObjectElementManager();
    
    this.player = new Player(
      this.config.player.id,
      this.config.player.initialPos,
      new Atributes(8, this.config.player.level, 10, 10, 10, 10, 10, 10)
    );
    this.logger.log('domain', 'Player entity created:', this.player);
    

    this.objectManager.spawnInitialElements();
    this.logger.log('domain', 'Initial enemies spawned via ObjectManager.');
  }

  /** Interface de comunicação que passa a responsabilidade para o domínio. @param command O objeto de comando vindo da camada de apresentação. @param deltaTime O tempo desde o último frame, usado para calcular o movimento. */
  public handlePlayerInteractions(command: { actions: Array<'up' | 'down' | 'left' | 'right'> }, deltaTime: number): void {
    this.logger.log('input', 'Handling player movement in domain:', command);
    this.player.movePlayer(command.actions, deltaTime);
  }

  /** Fase de Desenho (Coleta de Dados): Constrói e retorna uma representação em DTOs do estado atual do jogo para a camada de renderização. @throws {Error} Se o mundo não foi inicializado. @returns Um objeto com o estado do mundo e uma lista de DTOs renderizáveis. */
  public getRenderState(): { world: WorldState; renderables: readonly RenderableState[] } {
    this.logger.log('sync', 'DomainFacade getting render state...');
    if (!this.world) throw new Error("O mundo do domínio não foi inicializado. Chame setWorld() antes de getRenderState().");

    // Constrói o DTO de estado para o jogador, garantindo que ele tenha a estrutura correta.
    const playerState: RenderableState = {
      id: this.player.id,
      entityTypeId: this.player.objectId,
      coordinates: this.player.coordinates,
      size: this.player.size,
      state: this.player.state,
    };
    const otherStates = this.objectManager.getAllRenderableStates();

    return { 
      world: { width: this.world.width, height: this.world.height }, 
      renderables: [playerState, ...otherStates] // Agora todos os elementos são objetos RenderableState.
    };
  }

  /** Configura os listeners para eventos de domínio. */
  private setupEventListeners(): void {
    gameEvents.on('enemyDied', (payload) => {
      // Por enquanto, assume-se que o jogador é sempre o assassino.
      if (this.player) {
        this.player.gainXp(payload.xpGiven, this.xpTable);
        this.logger.log('domain', `Player gained ${payload.xpGiven} XP.`);
      }
    });
  }
}