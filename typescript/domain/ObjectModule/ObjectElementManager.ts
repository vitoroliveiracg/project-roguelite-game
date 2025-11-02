/** @file Contém a classe ObjectElementManager, responsável por gerenciar o ciclo de vida (criação, atualização, remoção) de uma coleção de entidades de domínio. */
import type { EntityRenderableState } from "../ports/domain-contracts";
import Bullet from "./Entities/bullets/Bullet";
import BlackEnemy from "./Entities/Enemies/BlackEnemy";
import Entity from "./Entities/Entity";
import CircleForm from "./Entities/geometryForms/circleForm";
import ObjectElement from "./ObjectElement";
import Quadtree from "../shared/QuadTree"; // <-- 1. Importar a nova classe
import { gameEvents } from "../eventDispacher/eventDispacher";
import { SimpleBullet } from "./Entities/bullets/SimpleBullet";
import { logger } from "../../adapters/web/shared/Logger";

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

  constructor() {
    logger.log('init', 'ObjectElementManager instantiated.');
    this.setupEventListeners(); // Configura os listeners no construtor.
  }

  
  //? ----------- Methods -----------

  /** * Popula o mundo com os elementos iniciais (inimigos, NPCs, itens, etc.). Este método pode ser expandido para ler de uma configuração de nível no futuro. */
  public spawnInitialElements(): void { 
    const enemyCount = 5;
    const gridCols = 10; // 10 inimigos por linha
    const spacing = 24;  // Espaço entre inimigos. Raio da hitbox é 8, diâmetro é 16. 24px garante que não colidam.
    const startPos = { x: 200, y: 200 };

    for (let i = 0; i < enemyCount; i++) {
      const col = i % gridCols;
      const row = Math.floor(i / gridCols);

      const x = startPos.x + col * spacing;
      const y = startPos.y + row * spacing;

      this.spawn(id => new BlackEnemy(
        id,
        1,
        50, // XP base que o BlackEnemy concede
        { x, y },
        "blackEnemy", 
        { strength: 12, dexterity: 8, inteligence: 5, wisdown: 5, charisma: 2, constitution: 15 }
      ));
    }
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

  /** * Executa o método `update` de todas as entidades gerenciadas. * @param deltaTime O tempo decorrido desde o último frame. */
  public updateAll(deltaTime: number): void {
    for (const element of this.elements.values()) {
      // Apenas entidades (Entity) possuem lógica de update.
      if (
        element instanceof Entity || element instanceof CircleForm || element instanceof Bullet) {
        element.update(deltaTime);
      }
    }
    // A Quadtree precisa ser reconstruída a cada quadro, pois os objetos se movem.
    this.collisionTree = new Quadtree(this.worldBounds); // Recria a árvore com os limites corretos do mundo.
    for (const element of this.elements.values()) {
      this.collisionTree.insert(element); // Insere todos os elementos na árvore
    }

    this.checkCollisions();
  }

  //? ----------- Getters and Setters -----------

  /** * Retorna uma lista de DTOs (`EntityRenderableState`) para todas as entidades gerenciadas. * @returns Um array com o estado renderizável de cada entidade. */
  public getAllRenderableStates(): EntityRenderableState[] {
    const states: EntityRenderableState[] = [];
    for (const element of this.elements.values()) {
      // Garante que a rotação seja um número para o DTO.
      const rotation = typeof element.rotation === 'number' ? element.rotation : 0;
      const hitboxes = element.hitboxes?.map(hb => hb.getDebugShape()) ?? [];
      states.push({
        id: element.id,
        entityTypeId: element.objectId,
        coordinates: element.coordinates,
        size: element.size,
        state: element.state,
        rotation: rotation,
        hitboxes: hitboxes, // Adiciona as formas das hitboxes ao DTO
      });
    }
    return states;
  }
  /** * Remove um elemento do mapa com base no ID fornecido. @param id O número (key) do elemento a ser removido. @returns Retorna true se o elemento existia e foi removido, ou false caso contrário. */
  public removeByID(id: number): boolean {
    return this.elements.delete(id);
  }
  /** Define os limites do mundo, essenciais para a inicialização da Quadtree. */
  public setWorldBounds(width: number, height: number): void {
    this.worldBounds = { x: 0, y: 0, width, height };
    this.collisionTree = new Quadtree(this.worldBounds);
  }

  private checkCollisions(): void {
    const processedPairs = new Set<string>();

    for (const elementA of this.elements.values()) {

      if (!elementA.hitboxes || elementA.hitboxes.length === 0) continue;

      const potentialColliders = this.collisionTree.retrieve(elementA);

      for (const elementB of potentialColliders) {

        if (elementA.id === elementB.id || !elementB.hitboxes || elementB.hitboxes.length === 0) continue;

        const pairKey = elementA.id < elementB.id ? `${elementA.id}-${elementB.id}` : `${elementB.id}-${elementA.id}`;

        if (processedPairs.has(pairKey)) continue; 

        for (const hitboxA of elementA.hitboxes!) {

          for (const hitboxB of elementB.hitboxes!) {
            
            if (hitboxA.intersects(hitboxB)) {
              hitboxA.onColision(elementB, elementA);
              hitboxB.onColision(elementA, elementB);
              
              console.log("hitbox", `object ${elementA} colided ${elementB}`)
              processedPairs.add(pairKey);
              break;
            }
          }
          
          if (processedPairs.has(pairKey)) break;
        }
      }
    }
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
  }
}