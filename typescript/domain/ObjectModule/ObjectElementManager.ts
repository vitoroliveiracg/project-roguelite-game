/** @file Contém a classe ObjectElementManager, responsável por gerenciar o ciclo de vida (criação, atualização, remoção) de uma coleção de entidades de domínio. */
import type { EntityRenderableState } from "../ports/domain-contracts";
import Bullet from "./Entities/projectiles/Bullet";
import Slime from "./Entities/Enemies/Slime";
import Projectile from "./Entities/projectiles/Projectile";
import type Player from "./Entities/Player/Player";
import Entity from "./Entities/Entity";
import CircleForm from "./Entities/geometryForms/circleForm";
import ObjectElement from "./ObjectElement";
import Attributes from "./Entities/Attributes";
import type { IEventManager } from "../eventDispacher/IGameEvents";
import DroppedItem from "./Items/DroppedItem";
import Gun from "./Items/Weapons/RangedWeapons/Gun";
import type { ICollisionService } from "../ports/ICollisionService";
import { SimpleBullet } from "./Entities/projectiles/SimpleBullet";
import Scythe from "./Items/Weapons/RangedWeapons/Scythe";
import MagicWand from "./Items/Weapons/RangedWeapons/MagicWand";
import { SpawnRegistry } from "./SpawnRegistry";

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

    this.eventManager.on('requestNeighbors', (payload) => {
      const neighbors: ObjectElement[] = [];
      
      // Centro de quem solicitou a busca
      const reqX = payload.requester.coordinates.x + (payload.requester.size.width / 2);
      const reqY = payload.requester.coordinates.y + (payload.requester.size.height / 2);

      for (const element of this.elements.values()) {
        if (element.id !== payload.requester.id) {
          // Centro do alvo avaliado
          const elX = element.coordinates.x + (element.size.width / 2);
          const elY = element.coordinates.y + (element.size.height / 2);
          
          const distance = Math.sqrt(Math.pow(reqX - elX, 2) + Math.pow(reqY - elY, 2));
          
          if (distance <= payload.radius) {
            neighbors.push(element);
          }
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

    // Em seguida, atualizamos cada elemento. Durante seu update, ele pode pedir vizinhos.
    for (const element of this.elements.values()) {
      if (
        element instanceof Entity || element instanceof CircleForm || element instanceof Projectile || element instanceof DroppedItem
      ) {
        element.update(deltaTime, player);
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
    this.spawnWave();

    // Spawna a arma inicial no chão, próxima de onde o jogador nasce (512, 512)
    this.spawn(id => new DroppedItem(id, { x: 550, y: 512 }, new Gun(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 580, y: 512 }, new Scythe(), this.eventManager));
    this.spawn(id => new DroppedItem(id, { x: 520, y: 550 }, new MagicWand(), this.eventManager));
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
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element || !element.hitboxes) continue;

        for (let j = 0; j < element.hitboxes.length; j++) {
          const hitbox = element.hitboxes[j];
          if (!hitbox) continue;

          const shape = hitbox.getDebugShape();
          if (shape.type === 'circle') {
            if (offset + 4 > this.collisionBuffer.length) {
              const newBuffer = new Float32Array(this.collisionBuffer.length * 2);
              newBuffer.set(this.collisionBuffer);
              this.collisionBuffer = newBuffer;
            }
            this.collisionBuffer[offset++] = element.id;
            this.collisionBuffer[offset++] = shape.coordinates.x;
            this.collisionBuffer[offset++] = shape.coordinates.y;
            this.collisionBuffer[offset++] = shape.radius || 0;
          }
        }
      }

      const hitboxCount = offset / 4;
      const dataToSend = this.collisionBuffer.subarray(0, offset); // Cria uma View sem clonar a memória

      // Envia (Fire and Forget)
      this.collisionService.checkCollisions(dataToSend, hitboxCount, this.worldBounds).then((pairs) => {
        this.pendingCollisions = pairs;
        this.isCheckingCollisions = false; // Libera a trava para enviar o próximo frame
      }).catch((err) => {
        console.error("Collision worker failed:", err);
        this.isCheckingCollisions = false; // Destrava o loop em caso de falha crítica
      });
  }

  
}