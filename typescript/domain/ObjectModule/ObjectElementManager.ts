/** @file Contém a classe ObjectElementManager, responsável por gerenciar o ciclo de vida (criação, atualização, remoção) de uma coleção de entidades de domínio. */
import type { EntityRenderableState } from "../ports/domain-contracts";
import Bullet from "./Entities/bullets/Bullet";
import Slime from "./Entities/Enemies/Slime";
import type Player from "./Entities/Player/Player";
import Entity from "./Entities/Entity";
import CircleForm from "./Entities/geometryForms/circleForm";
import ObjectElement from "./ObjectElement";
import Quadtree from "../shared/QuadTree";
import { gameEvents } from "../eventDispacher/eventDispacher";
import { logger } from "../../adapters/web/shared/Logger";
import Attributes from "./Entities/Attributes";

/** * @class ObjectElementManager * Gerencia uma coleção de `ObjectElement`s (como inimigos, itens, projéteis). * Esta classe encapsula a lógica de adicionar, remover, atualizar e acessar * grupos de entidades, permitindo que a `DomainFacade` delegue essa * responsabilidade e permaneça focada na orquestração de alto nível. */
export default class ObjectElementManager {
  /** @private Um mapa que armazena todas as entidades gerenciadas, usando o ID como chave para acesso rápido. */
  private elements: Map<number, ObjectElement> = new Map();
  /** @private Um contador para gerar IDs únicos para novas entidades. Começa em 100 para evitar colisões com IDs estáticos (como o do jogador). */
  private nextId: number = 100;
  /** @private A estrutura de dados de particionamento espacial para otimizar a detecção de colisão. */
  private collisionTree!: Quadtree;
  /** @private Armazena os limites do mundo para recriar a Quadtree. */
  private worldBounds: { x: number, y: number, width: number, height: number } = { x: 0, y: 0, width: 0, height: 0 };
  /** @private Rastreia os pares de entidades que colidiram recentemente para evitar chamadas repetidas. A chave é uma string como 'id1-id2' e o valor é o timestamp de quando o cooldown expira. */
  private collisionCooldowns: Map<string, number> = new Map();
  
  /** @private O tempo em milissegundos que uma colisão entre um par de entidades deve ser ignorada antes de ser processada novamente. */
  private readonly COLLISION_COOLDOWN_MS = 30;

  constructor() {
    logger.log('init', 'ObjectElementManager instantiated.');
    this.setupEventListeners();
  }

  
  //? ----------- Methods -----------

  /** * Popula o mundo com os elementos iniciais (inimigos, NPCs, itens, etc.). Este método pode ser expandido para ler de uma configuração de nível no futuro. */
  public spawnInitialElements(): void { 
    const enemyCount = 50;
    const gridCols = 10; // 10 inimigos por linha
    const spacing = 24;  // Espaço entre inimigos. Raio da hitbox é 8, diâmetro é 16. 24px garante que não colidam.
    const startPos = { x: 200, y: 200 };

   setInterval(()=>{
     for (let i = 0; i < enemyCount; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);

      const x = startPos.x + col * spacing;
      const y = startPos.y + row * spacing;

      this.spawn(id => new Slime(
        id,
        50,
        50,
        { x, y },
        new Attributes( 8, 1, 12, 8, 5, 5, 2, 15)
      ));
    }
   }, 5000)
   
  }
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

      const queryBounds = { x: payload.requester.coordinates.x - payload.radius, y: payload.requester.coordinates.y - payload.radius, width: payload.radius * 2, height: payload.radius * 2 };
      const neighbors = this.collisionTree.retrieve(queryBounds);
      
      payload.callback(neighbors);
    });
  }
  /** Define os limites do mundo, essenciais para a inicialização da Quadtree. */
  public setWorldBounds(width: number, height: number): void {
    this.worldBounds = { x: 0, y: 0, width, height };
    this.collisionTree = new Quadtree(this.worldBounds);
  }

  /** * Executa o método `update` de todas as entidades gerenciadas. * @param deltaTime O tempo decorrido desde o último frame. */
  public updateAll(deltaTime: number, player: Player): void {
    // Primeiro, reconstruímos a árvore com as posições do frame anterior.
    const allElements = [player, ...this.elements.values()];
    this.rebuildCollisionTree(allElements);

    // Em seguida, atualizamos cada elemento. Durante seu update, ele pode pedir vizinhos.
    for (const element of this.elements.values()) {
      if (
        element instanceof Entity || element instanceof CircleForm || element instanceof Bullet) {
        element.update(deltaTime);
      }
    }

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

  private rebuildCollisionTree(elements: ObjectElement[]): void {
    this.collisionTree = new Quadtree(this.worldBounds);
    for (const element of elements) {
      this.collisionTree.insert(element);
    }
  }

  private checkCollisions(elements: ObjectElement[]): void {
    const processedPairs = new Set<string>();
    for (const elementA of elements) {

      if (!elementA.hitboxes || elementA.hitboxes.length === 0) continue;

      const potentialColliders = this.collisionTree.retrieve(elementA);

      for (const elementB of potentialColliders) {

        if (elementA.id === elementB.id || !elementB.hitboxes || elementB.hitboxes.length === 0) continue;

        const pairKey = elementA.id < elementB.id ? `${elementA.id}-${elementB.id}` : `${elementB.id}-${elementA.id}`;

        if (processedPairs.has(pairKey)) continue; 

        const now = Date.now();
        const cooldownTimestamp = this.collisionCooldowns.get(pairKey);
        if (cooldownTimestamp && now < cooldownTimestamp) continue;

        for (const hitboxA of elementA.hitboxes!) {

          for (const hitboxB of elementB.hitboxes!) {
            
            if (hitboxA.intersects(hitboxB)) {
              hitboxA.onColision(elementB);
              hitboxB.onColision(elementA);
              
              logger.log("hitbox", `Collision detected between ${elementA.objectId} (ID: ${elementA.id}) and ${elementB.objectId} (ID: ${elementB.id})`);
              this.collisionCooldowns.set(pairKey, now + this.COLLISION_COOLDOWN_MS);
              processedPairs.add(pairKey);
              break;
            }
          }
          
          if (processedPairs.has(pairKey)) break;
        }
      }
    }
  }

  
}