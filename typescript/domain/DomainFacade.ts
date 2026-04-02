/** @file Implementa a fachada do domínio, o único ponto de entrada para a lógica de negócio do jogo. */
import type { ILogger } from "./ports/ILogger";
import type { IGameDomain, RenderableState, WorldState } from "./ports/domain-contracts";

import Player from "./ObjectModule/Entities/Player/Player";
import ObjectElementManager from "./ObjectModule/ObjectElementManager";
import World from "./World";
import Attributes from "./ObjectModule/Entities/Attributes";
import type { action } from "./eventDispacher/actions.type";
import ActionManager from "./eventDispacher/ActionManager";
import type { IEventManager } from "./eventDispacher/IGameEvents";
import type { ICollisionService } from "./ports/ICollisionService";

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

  private actionManager!: ActionManager;
  private cachedRenderState = {
    world: { width: 0, height: 0 },
    renderables: [] as any[]
  };
  private cachedPlayerState: any = null;

  /** @constructor @param config O objeto de configuração com os dados iniciais para a criação das entidades do jogo. @param logger Uma instância de um logger que implementa a interface `ILogger`. */
  constructor(config: DomainConfig, logger: ILogger, private eventManager: IEventManager, private collisionService: ICollisionService) {
    this.config = config;
    this.logger = logger;
    this.logger.log('init', 'DomainFacade instantiated.');

    this.objectManager = new ObjectElementManager(this.eventManager, this.collisionService);

  }


  /** Fase de Update (Lógica): Avança o estado de todas as entidades do domínio. Chamado a cada frame pelo Adapter. @param deltaTime O tempo em segundos decorrido desde o último frame. */
  public update(deltaTime: number): void {
    // Limita o deltaTime a um valor máximo razoável (ex: 1/30 de segundo)
    // para evitar "saltos" de física se o jogo engasgar.
    const clampedDeltaTime = Math.min(deltaTime, 1 / 30);

    this.logger.log('domain', `Update cycle started (deltaTime: ${clampedDeltaTime})`);

    this.player.update(clampedDeltaTime);
    this.objectManager.updateAll(clampedDeltaTime, this.player);
  }

  /** Fase de Inicialização: Cria as instâncias das entidades de domínio (`World`, `Player`) com base no contexto fornecido pelo Adapter. @param width A largura do mundo. @param height A altura do mundo. */
  public setWorld(width: number, height: number): void {
    this.logger.log('domain', `Setting world: ${width}x${height}`);
    this.world = new World(width, height);
    this.objectManager.setWorldBounds(width, height);
    
    this.player = new Player(
      this.config.player.id,
      this.config.player.initialPos,
      new Attributes(8, this.config.player.level, 10, 10, 10, 10, 10, 10),
      this.eventManager
    );
    this.actionManager = new ActionManager(this.player, this.logger, this.eventManager);
    this.logger.log('domain', 'Player entity created:', this.player);
    

    this.objectManager.spawnInitialElements();
    this.logger.log('domain', 'Initial enemies spawned via ObjectManager.');
  }

  /** Interface de comunicação que passa a responsabilidade para o domínio. @param command O objeto de comando vindo da camada de apresentação. @param deltaTime O tempo desde o último frame, usado para calcular o movimento. */
  public handlePlayerInteractions(command: { actions: Array<action> }, mouseLastCoordinates: {x:number,y:number}): void {
    this.logger.log('input', 'Handling input in domain:', command);
    this.actionManager.checkEvent(command.actions, mouseLastCoordinates)
  }

  public manageInventory(action: 'equip' | 'unequip', payload: { index?: number; slot?: string }): void {
    if (action === 'equip' && payload.index !== undefined) {
      this.player.inventory.equipItem(payload.index);
    }
    if (action === 'unequip' && payload.slot !== undefined) {
      this.player.inventory.unequipItem(payload.slot);
    }
  }

  public manageSkillTree(action: 'unlock' | 'changeClass', payload: { className?: string; skillId?: string }): void {
    if (action === 'changeClass' && payload.className) {
       this.player.setActiveClass(payload.className);
    } else if (action === 'unlock' && payload.skillId) {
       this.player.unlockSkill(payload.skillId);
    }
  }

  public allocateAttribute(attribute: string): void {
    this.player.allocateAttribute(attribute as any);
  }

  /** Fase de Desenho (Coleta de Dados): Constrói e retorna uma representação em DTOs do estado atual do jogo para a camada de renderização. @throws {Error} Se o mundo não foi inicializado. @returns Um objeto com o estado do mundo e uma lista de DTOs renderizáveis. */
  public getRenderState(): { world: WorldState; renderables: readonly RenderableState[] } {
    this.logger.log('sync', 'DomainFacade getting render state...');
    if (!this.world) throw new Error("O mundo do domínio não foi inicializado. Chame setWorld() antes de getRenderState().");

    this.cachedRenderState.world.width = this.world.width;
    this.cachedRenderState.world.height = this.world.height;

    if (!this.cachedPlayerState) {
      this.cachedPlayerState = {
        id: this.player.id,
        entityTypeId: this.player.objectId,
        coordinates: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
        attributes: {},
        equipment: {}
      };
    }

    const ps = this.cachedPlayerState;
    ps.coordinates.x = this.player.coordinates.x;
    ps.coordinates.y = this.player.coordinates.y;
    ps.size.width = this.player.size.width;
    ps.size.height = this.player.size.height;
    ps.state = this.player.state;
    ps.rotation = this.player.rotation;
    ps.hitboxes = this.player.hitboxes?.map(hb => hb.getDebugShape()) ?? [];
    
    ps.level = this.player.attributes.level;
    ps.currentXp = this.player.attributes.currentXp;
    ps.xpToNextLevel = this.player.attributes.xpToNextLevel;
    ps.hp = this.player.attributes.hp;
    ps.maxHp = this.player.attributes.maxHp;
    ps.mana = this.player.attributes.mana;
    ps.maxMana = this.player.attributes.maxMana;
    
    ps.attributes.strength = this.player.attributes.strength;
    ps.attributes.constitution = this.player.attributes.constitution;
    ps.attributes.dexterity = this.player.attributes.dexterity;
    ps.attributes.intelligence = this.player.attributes.intelligence;
    ps.attributes.wisdom = this.player.attributes.wisdom;
    ps.attributes.charisma = this.player.attributes.charisma;
    ps.attributes.availablePoints = this.player.attributes.availablePoints;

    ps.backpack = this.player.inventory.backpack.map(item => ({ name: item.name, iconId: item.iconId }));
    ps.equipment.mainHand = this.player.inventory.equipment.mainHand ? { name: this.player.inventory.equipment.mainHand.name, iconId: this.player.inventory.equipment.mainHand.iconId } : undefined;

    ps.activeClass = this.player.activeClass;
    ps.unlockedClasses = this.player.unlockedClasses;
    ps.classes = this.player.classes.map(c => ({
        name: c.name,
        isUnlocked: this.player.unlockedClasses.includes(c.name),
        isActive: this.player.activeClass === c.name
    }));
    
    ps.skillTree = (this.player.activeClass ? this.player.classes.find(c => c.name === this.player.activeClass)?.allSkills.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        tier: s.tier,
        unlocked: this.player.unlockedSkills.has(s.id),
        canUnlock: !s.requiredSkillId || this.player.unlockedSkills.has(s.requiredSkillId)
    })) : []) ?? [];

    const otherStates = this.objectManager.getAllRenderableStates();
    
    this.cachedRenderState.renderables = [ps, ...otherStates];
    return this.cachedRenderState;
  }

}
