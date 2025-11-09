/** @file Contém a classe ObjectElementManager, responsável por gerenciar o ciclo de vida (criação, atualização, remoção) de uma coleção de entidades de domínio. */
import type { EntityRenderableState } from "../ports/domain-contracts";
import Bullet from "./Entities/bullets/Bullet";
import Slime from "./Entities/Enemies/Slime";
import type Player from "./Entities/Player/Player";
import Entity from "./Entities/Entity";
import CircleForm from "./Entities/geometryForms/circleForm";
import ObjectElement from "./ObjectElement";
import { gameEvents } from "../eventDispacher/eventDispacher";
import Attributes from "./Entities/Attributes";

/** * @class ObjectElementManager * Gerencia uma coleção de `ObjectElement`s (como inimigos, itens, projéteis). * Esta classe encapsula a lógica de adicionar, remover, atualizar e acessar * grupos de entidades, permitindo que a `DomainFacade` delegue essa * responsabilidade e permaneça focada na orquestração de alto nível. */
export default class ObjectElementManager {
  /** @private Um mapa que armazena todas as entidades gerenciadas, usando o ID como chave para acesso rápido. */
  private elements: Map<number, ObjectElement> = new Map();
  /** @private Um contador para gerar IDs únicos para novas entidades. Começa em 100 para evitar colisões com IDs estáticos (como o do jogador). */
  private nextId: number = 100;
  /** @private Armazena os limites do mundo para recriar a Quadtree. */
  private worldBounds: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 0, height: 0 };
  
  private collisionWorker: Worker;
  private isCheckingCollisions: boolean = false;

  constructor() {
    gameEvents.dispatch('log', { channel: 'init', message: 'ObjectElementManager instantiated.', params: [] });
    this.collisionWorker = new Worker(new URL('./Collision.worker.ts', import.meta.url), { type: 'module' });
    this.setupEventListeners();
  }

  
  //? ----------- Methods -----------

  /** Configura os listeners para eventos de domínio que afetam os objetos gerenciados. */
  private setupEventListeners(): void {

    gameEvents.on('spawn', (payload) => {
      const newElement = this.spawn(payload.factory);
      payload.onSpawned?.(newElement);
    });
    
    gameEvents.on('despawn', payload => {
      this.removeByID(payload.objectId);
    });

    gameEvents.on('requestNeighbors', (payload) => {
      // Esta funcionalidade precisaria ser reimplementada com o worker ou de outra forma.
      // Por enquanto, retornamos uma lista vazia para evitar quebras.
      payload.callback([]);
    });
  }

  /** * Executa o método `update` de todas as entidades gerenciadas. * @param deltaTime O tempo decorrido desde o último frame. */
  public async updateAll(deltaTime: number, player: Player): Promise<void> {
    const allElements = [player, ...this.elements.values()];

    // Em seguida, atualizamos cada elemento. Durante seu update, ele pode pedir vizinhos.
    for (const element of this.elements.values()) {
      if (
        element instanceof Entity || element instanceof CircleForm || element instanceof Bullet) {
        element.update(deltaTime);
      }
    }

    // Após todas as atualizações, garante que ninguém saiu dos limites do mapa.
    for (const element of this.elements.values()) {
      this.clampToWorldBounds(element);
    }
    // O jogador também precisa ser verificado.
    this.clampToWorldBounds(player);

    await this.checkCollisions(allElements);
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
    const enemyCount = 20;
    const gridCols = 10; //? 10 inimigos por linha
    const spacing = 24;  //? Espaço entre inimigos. Raio da hitbox é 8, diâmetro é 16. 24px garante que não colidam no spawn
    const startPos = { x: 200, y: 200 };

   setInterval(()=>{
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
      ));
    }
   }, 5000)
   
  }
  /** * Retorna uma lista de DTOs (`EntityRenderableState`) para todas as entidades gerenciadas. * @returns Um array com o estado renderizável de cada entidade. */
  public getAllRenderableStates(): EntityRenderableState[] {
    const states: EntityRenderableState[] = [];
    
    for (const element of this.elements.values()) {
      const rotation = typeof element.rotation === 'number' ? element.rotation : 0;
      const hitboxes = element.hitboxes?.map(hb => hb.getDebugShape()) ?? [];

      states.push({
        id: element.id,
        entityTypeId: element.objectId,
        coordinates: element.coordinates,
        size: element.size,
        state: element.state,
        rotation: rotation,
        hitboxes: hitboxes,
      });
      
    }
    return states;
  }

  private checkCollisions(elements: ObjectElement[]): Promise<void> {
    return new Promise((resolve) => {
      if (this.isCheckingCollisions) {
        resolve();
        return;
      }
      this.isCheckingCollisions = true;

      // Envia apenas os dados necessários para o worker, não a instância completa da classe.
      // Extrai apenas os dados puros das hitboxes para evitar o erro de clonagem de função.
      const plainElements = elements.map(element => ({
        id: element.id,
        x: element.coordinates.x,
        y: element.coordinates.y,
        width: element.size.width,
        height: element.size.height,
        // Ajusta a estrutura da hitbox para o formato que o worker espera (sem 'coordinates' aninhado).
        hitboxes: element.hitboxes?.map(hb => {
          const shape = hb.getDebugShape();
          return {
            ...shape,
            x: shape.coordinates.x,
            y: shape.coordinates.y,
          };
        }) ?? null,
      }));

      this.collisionWorker.onmessage = (event: MessageEvent<[number, number][]>) => {
        const collidingPairs = event.data;
        for (const [idA, idB] of collidingPairs) {
          // Busca os elementos no array original que foi enviado para o worker,
          // pois ele contém a referência para o jogador e para os outros elementos.
          const elementA = elements.find(e => e.id === idA);
          const elementB = elements.find(e => e.id === idB);

          if (elementA && elementB) {
            elementA.hitboxes?.[0]?.onColision(elementB);
            elementB.hitboxes?.[0]?.onColision(elementA);
          }
        }
        this.isCheckingCollisions = false;
        resolve();
      };

      this.collisionWorker.postMessage({ elements: plainElements, worldBounds: this.worldBounds });
    });
  }

  
}