/** @file Contém a classe ObjectElementManager, responsável por gerenciar o ciclo de vida (criação, atualização, remoção) de uma coleção de entidades de domínio. */
import type { EntityRenderableState } from "../ports/domain-contracts";
import Slime from "./Entities/Enemies/Slime";
import type Player from "./Entities/Player/Player";
import ObjectElement from "./ObjectElement";
import Attributes from "./Entities/Attributes";
import type { IEventManager } from "../eventDispacher/IGameEvents";
import DroppedItem from "./Items/DroppedItem";
import Gun from "./Items/Weapons/RangedWeapons/Gun";
import type { ICollisionService } from "../ports/ICollisionService";
import Scythe from "./Items/Weapons/MeleeWeapons/Scythe"; // Movido para MeleeWeapon!
import SimpleStaff from "./Items/Weapons/RangedWeapons/Staffs/SimpleStaff";
import IronHelmet from "./Items/Armors/helmet/IronHelmet";
import IronChestplate from "./Items/Armors/chestplates/IronChestplate";
import IronPants from "./Items/Armors/pants/IronPants";
import IronBoots from "./Items/Armors/boots/IronBoots";
import IronGloves from "./Items/Armors/glooves/IronGloves";
import { SpawnRegistry } from "./SpawnRegistry";
import SimpleAmulet from "./Items/Armors/necklaces/SimpleAmulet";
import SimpleRing from "./Items/Armors/rings/SimpleRing";
import SimpleSword from "./Items/Weapons/MeleeWeapons/SimpleSword";
import VampireFang from "./Items/Consumables/VampireFang";
import MegaMushroom from "./Items/Consumables/MegaMushroom";
import AdrenalineFlask from "./Items/Consumables/Potions/AdrenalineFlask";
import DemonBlood from "./Items/Consumables/DemonBlood";
import ShadowMob from "./Entities/Enemies/ShadowMob";
import FishingRod from "./Items/Weapons/RangedWeapons/FishingRod";

// Auto-carrega todas as entidades e itens do domínio para engatilhar os decorators @RegisterSpawner
import.meta.glob('./Entities/**/*.ts', { eager: true });
import.meta.glob('./Items/**/*.ts', { eager: true });

/** * @class ObjectElementManager * Gerencia uma coleção de `ObjectElement`s (como inimigos, itens, projéteis). * Esta classe encapsula a lógica de adicionar, remover, atualizar e acessar * grupos de entidades, permitindo que a `DomainFacade` delegue essa * responsabilidade e permaneça focada na orquestração de alto nível. */
export default class ObjectElementManager {
  /** @private Um mapa que armazena todas as entidades gerenciadas, usando o ID como chave para acesso rápido. */
  private elements: Map<number, ObjectElement> = new Map();
  /** @private Um contador para gerar IDs únicos para novas entidades. Começa em 100 para evitar colisões com IDs estáticos (como o do jogador). */
  private nextId: number = 100;
  /** @private Armazena os limites do mundo para recriar a Quadtree. */
  private worldBounds: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 0, height: 0 };
  
  private isCheckingCollisions: boolean = false;

  private waveTimer: number = 0;
  private readonly WAVE_INTERVAL: number = 5; // 5 segundos de jogo para a próxima onda
  private shadowMobTimer: number = 0;
  private readonly SHADOW_MOB_INTERVAL: number = 30; // 30 segundos para a aparição do mago sombrio
  private renderStatePool: EntityRenderableState[] = [];
  private pendingCollisions: Int32Array = new Int32Array(0);
  private collisionBuffer: Float32Array = new Float32Array(10000); // Espaço para 2500 hitboxes simultâneas

  constructor(private eventManager: IEventManager, private collisionService: ICollisionService) {
    this.eventManager.dispatch('log', { channel: 'init', message: 'ObjectElementManager instantiated.', params: [] });
    this.setupEventListeners();
  }

  
  //? ----------- Methods -----------

  /** Configura os listeners para eventos de domínio que afetam os objetos gerenciados. */
  private setupEventListeners(): void {

    this.eventManager.on('spawn', (payload) => {
      const factory = SpawnRegistry.strategies.get(payload.type);
      if (factory) {
        this.spawn(id => factory(id, payload, this.eventManager));
      } else {
        this.eventManager.dispatch('log', { channel: 'error', message: `(Manager) Nenhuma fábrica registrada para o tipo: ${payload.type}`, params: [] });
      }
    });
    
    this.eventManager.on('despawn', payload => {
      this.removeByID(payload.objectId);
    });

    this.eventManager.on('requestNeighbors', (payload :any) => {
      const neighbors: ObjectElement[] = [];
      
      // Centro de quem solicitou a busca
      let reqX = 0;
      let reqY = 0;

      if (payload.coordinates) {
        reqX = payload.coordinates.x;
        reqY = payload.coordinates.y;
      } else if (payload.requester) {
        reqX = payload.requester.coordinates.x + (payload.requester.size.width / 2);
        reqY = payload.requester.coordinates.y + (payload.requester.size.height / 2);
      } else {
        return payload.callback(neighbors);
      }


      for (const element of this.elements.values()) {
        if (payload.requester && element.id === payload.requester.id) continue;
        
        const elX = element.coordinates.x + (element.size.width / 2);
        const elY = element.coordinates.y + (element.size.height / 2);
        const distance = Math.hypot(reqX - elX, reqY - elY);
        
        if (distance <= payload.radius) {
          neighbors.push(element);
        }
      }
      
      payload.callback(neighbors);
    });
  }

  /** * Executa o método `update` de todas as entidades gerenciadas. * @param deltaTime O tempo decorrido desde o último frame. */
  public updateAll(deltaTime: number, player: Player): void {
    const allElements = [player, ...this.elements.values()];

    // Resolução Atrasada: Aplica as colisões do último frame processado, sem travar esse!
    for (let i = 0; i < this.pendingCollisions.length; i += 2) {
      const idA = this.pendingCollisions[i];
      const idB = this.pendingCollisions[i + 1];
      if (idA === undefined || idB === undefined) continue;

      const elementA = this.elements.get(idA) || (player.id === idA ? player : undefined);
      const elementB = this.elements.get(idB) || (player.id === idB ? player : undefined);

      if (elementA && elementB) {
        elementA.hitboxes?.[0]?.onColision(elementB);
        elementB.hitboxes?.[0]?.onColision(elementA);
      }
    }
    this.pendingCollisions = new Int32Array(0); // Limpa para o próximo evento

    // O timer de spawn agora respeita o deltaTime. Se o jogo pausar, o deltaTime para de somar aqui.
    this.waveTimer += deltaTime;
    if (this.waveTimer >= this.WAVE_INTERVAL) {
      this.spawnWave();
      this.waveTimer = 0;
    }

    this.shadowMobTimer += deltaTime;
    if (this.shadowMobTimer >= this.SHADOW_MOB_INTERVAL) {
      this.spawnShadowMob(player);
      this.shadowMobTimer = 0;
    }

    // Em seguida, atualizamos cada elemento. Durante seu update, ele pode pedir vizinhos.
    const stunnedPositions = new Map<number, {x: number, y: number}>();

    for (const element of this.elements.values()) {
      if ('activeStatuses' in element && (element as any).activeStatuses?.has('stun')) {
          // Salva a posição exata imposta pelo controle de grupo (ex: Pescador arrastando)
          stunnedPositions.set(element.id, { x: element.coordinates.x, y: element.coordinates.y });
      }
      element.update(deltaTime, player);
    }

    // Anula qualquer movimento físico que a IA tentou fazer enquanto estava atordoada (Stunned)
    for (const [id, pos] of stunnedPositions) {
        const el = this.elements.get(id);
        if (el) {
            el.coordinates.x = pos.x;
            el.coordinates.y = pos.y;
            el.hitboxes?.forEach(hb => hb.updatePosition({ x: pos.x + el.size.width / 2, y: pos.y + el.size.height / 2 }));
        }
    }

    // Após todas as atualizações, garante que ninguém saiu dos limites do mapa.
    for (const element of this.elements.values()) {
      this.clampToWorldBounds(element);
    }
    // O jogador também precisa ser verificado.
    this.clampToWorldBounds(player);

    this.checkCollisions(allElements);
  }
  /** * Cria e adiciona uma nova entidade ao gerenciador usando uma função de fábrica. * Este método abstrai a criação de qualquer tipo de `ObjectElement`. * @param factoryFn Uma função que recebe um ID e retorna uma nova instância de `ObjectElement` (ou uma subclasse como `Enemy`, `Projectile`, etc.). * @returns A instância da entidade criada. * @template T O tipo específico da entidade a ser criada, que deve estender `ObjectElement`. */
  public spawn<T extends ObjectElement>(factoryFn: (id: number) => T): T {
    const newId = this.nextId++;
    const newElement = factoryFn(newId);
    if (!(newElement instanceof ObjectElement)) {
      throw new Error("A fábrica deve retornar uma instância de ObjectElement.");
    }
    this.elements.set(newId, newElement);
    
    return newElement;
  }
  /** * Remove um elemento do mapa com base no ID fornecido. @param id O número (key) do elemento a ser removido. @returns Retorna true se o elemento existia e foi removido, ou false caso contrário. */
  public removeByID(id: number): boolean {
    return this.elements.delete(id);
  }

  /** Busca uma entidade específica ativa no mundo pelo seu ID. */
  public getElementById(id: number): ObjectElement | undefined {
    return this.elements.get(id);
  }

   /** Define os limites do mundo, essenciais para a inicialização da Quadtree. */
  public setWorldBounds(width: number, height: number): void {
    this.worldBounds = { x: 0, y: 0, width, height };
  }
  /** * Garante que a posição de um elemento esteja dentro dos limites do mundo. * @param element O elemento a ser verificado e corrigido. */
  private clampToWorldBounds(element: ObjectElement): void {
    const { coordinates, size } = element;
    const { width: worldWidth, height: worldHeight } = this.worldBounds;

    coordinates.x = Math.max(0, Math.min(coordinates.x, worldWidth - size.width));
    coordinates.y = Math.max(0, Math.min(coordinates.y, worldHeight - size.height));
  }

  /** * Popula o mundo com os elementos iniciais (inimigos, NPCs, itens, etc.). Este método pode ser expandido para ler de uma configuração de nível no futuro. */
  public spawnInitialElements(): void { 
    // this.spawnWave();

    // Spawna a arma inicial no chão, próxima de onde o jogador nasce (512, 512)
    this.spawn(id => new DroppedItem(id, { x: 550, y: 512 }, new Gun(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 580, y: 512 }, new Scythe(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 490, y: 512 }, new SimpleSword(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 520, y: 580 }, new SimpleStaff(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 450, y: 520 }, new IronHelmet(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 420, y: 520 }, new IronChestplate(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 390, y: 520 }, new IronPants(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 360, y: 520 }, new IronBoots(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 330, y: 520 }, new IronGloves(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 380, y: 520 }, new SimpleAmulet(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 400, y: 520 }, new SimpleRing(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 500, y: 550 }, new FishingRod(), this.eventManager));

    // Teste dos Efeitos Classic Survivor/Megabonk
    this.spawn(id => new DroppedItem(id, { x: 500, y: 480 }, new VampireFang(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 530, y: 480 }, new MegaMushroom(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 560, y: 480 }, new AdrenalineFlask(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 590, y: 480 }, new DemonBlood(), this.eventManager));


  }

  /** * Instancia uma onda de inimigos atrelada ao loop de atualização do domínio. */
  private spawnWave(): void {
    const enemyCount = 20;
    const gridCols = 10; //? 10 inimigos por linha
    const spacing = 24;  //? Espaço entre inimigos. Raio da hitbox é 8, diâmetro é 16. 24px garante que não colidam no spawn
    const startPos = { x: 200, y: 200 };

    for (let i = 0; i < enemyCount; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);

      const x = startPos.x + col * spacing;
      const y = startPos.y + row * spacing;

      this.spawn(id => new Slime(
        id,
        1,
        50,
        { x, y },
        new Attributes( 8, 3, 12, 8, 5, 5, 2, 15),
        this.eventManager
      ));
    }
  }

  /** Cria um inimigo sombrio fora do campo de visão imediato do jogador */
  private spawnShadowMob(player: Player): void {
    // Calcula uma distância aleatória entre 250 e 350 pixels (positiva ou negativa)
    const distanceX = Math.random() > 0.5 ? 250 + Math.random() * 100 : -250 - Math.random() * 100;
    const distanceY = Math.random() > 0.5 ? 250 + Math.random() * 100 : -250 - Math.random() * 100;
    const x = player.coordinates.x + distanceX;
    const y = player.coordinates.y + distanceY;

    this.spawn(id => new ShadowMob(id, { x, y }, new Attributes(10, 5, 10, 10, 20, 10, 10, 10), this.eventManager));
  }


  /** * Retorna uma lista de DTOs (`EntityRenderableState`) para todas as entidades gerenciadas. * @returns Um array com o estado renderizável de cada entidade. */
  public getAllRenderableStates(): EntityRenderableState[] {
    let index = 0;
    for (const element of this.elements.values()) {
      const rotation = typeof element.rotation === 'number' ? element.rotation : 0;

      let state = this.renderStatePool[index];
      if (!state) {
        state = {
          id: element.id,
          entityTypeId: element.objectId,
          coordinates: { x: 0, y: 0 },
          size: { width: 0, height: 0 },
          state: element.state,
          rotation: rotation,
        };
        this.renderStatePool[index] = state;
      }
      state.id = element.id;
      state.entityTypeId = element.objectId;
      state.coordinates.x = element.coordinates.x;
      state.coordinates.y = element.coordinates.y;
      state.size.width = element.size.width;
      state.size.height = element.size.height;
      state.state = element.state;
      state.rotation = rotation;
      state.equipment = (element as any).equipment;
      state.backpack = (element as any).backpack;
      state.coins = (element as any).coins;
      state.maxBackpackSize = (element as any).maxBackpackSize;
      state.hasBeard = (element as any).hasBeard;
      (state as any).facingDirection = (element as any).facingDirection;
      state.spellElements = (element as any).spellElements;
      
      if ('activeStatuses' in element) {
        const statuses = (element as any).activeStatuses as Map<string, any>;
        if (!state.activeStatuses) state.activeStatuses = [];
        let statusIndex = 0;
        for (const s of statuses.values()) {
            if (!state.activeStatuses[statusIndex]) state.activeStatuses[statusIndex] = { id: '', description: '', remaining: 0 };
            const uiStatus = state.activeStatuses[statusIndex]!;
            uiStatus.id = s.id;
            uiStatus.description = s.description;
            uiStatus.remaining = Math.max(0, s.duration - s.elapsed);
            statusIndex++;
        }
        state.activeStatuses.length = statusIndex;
      } else {
        if (state.activeStatuses) state.activeStatuses.length = 0;
      }

      if ('connectedTo' in element && (element as any).connectedTo) {
        state.connectedTo = (element as any).connectedTo;
      } else {
        delete state.connectedTo; // Remove a chave para respeitar o 'exactOptionalPropertyTypes'
      }

      // Reciclando o Array de Hitboxes (Livre do Garbage Collector)
      if (!state.hitboxes) state.hitboxes = [];
      const stateHitboxes = state.hitboxes as any[];
      
      if (element.hitboxes) {
        for (let j = 0; j < element.hitboxes.length; j++) {
          const hitbox = element.hitboxes[j];
          if (hitbox) {
            stateHitboxes[j] = hitbox.getDebugShape();
          }
        }
        stateHitboxes.length = element.hitboxes.length;
      } else {
        stateHitboxes.length = 0;
      }

      index++;
    }
    this.renderStatePool.length = index;
    return this.renderStatePool;
  }

  private checkCollisions(elements: ObjectElement[]): void {
      if (this.isCheckingCollisions) return;
      this.isCheckingCollisions = true;

      let offset = 0;
      const ensureBuffer = (size: number) => {
          if (offset + size > this.collisionBuffer.length) {
              const newBuffer = new Float32Array(this.collisionBuffer.length * 2 + size);
              newBuffer.set(this.collisionBuffer);
              this.collisionBuffer = newBuffer;
          }
      };

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element || !element.hitboxes) continue;

        for (let j = 0; j < element.hitboxes.length; j++) {
          const hitbox = element.hitboxes[j];
          if (!hitbox) continue;

          const shape = hitbox.getDebugShape();
          if (shape.type === 'circle') {
            ensureBuffer(5);
            this.collisionBuffer[offset++] = element.id;
            this.collisionBuffer[offset++] = 0; // Type 0 = Circle
            this.collisionBuffer[offset++] = shape.coordinates.x;
            this.collisionBuffer[offset++] = shape.coordinates.y;
            this.collisionBuffer[offset++] = shape.radius || 0;
          } else if (shape.type === 'polygon' && shape.points) {
            ensureBuffer(3 + shape.points.length * 2);
            this.collisionBuffer[offset++] = element.id;
            this.collisionBuffer[offset++] = 1; // Type 1 = Polygon
            this.collisionBuffer[offset++] = shape.points.length;
            for (const p of shape.points) {
                this.collisionBuffer[offset++] = p.x;
                this.collisionBuffer[offset++] = p.y;
            }
          }
        }
      }

      const dataToSend = this.collisionBuffer.subarray(0, offset); // Cria uma View sem clonar a memória

      // Envia (Fire and Forget)
      this.collisionService.checkCollisions(dataToSend, offset, this.worldBounds).then((pairs) => {
        this.pendingCollisions = pairs;
        this.isCheckingCollisions = false; // Libera a trava para enviar o próximo frame
      }).catch((err) => {
        console.error("Collision worker failed:", err);
        this.isCheckingCollisions = false; // Destrava o loop em caso de falha crítica
      });
  }

  
}