/** @file Contém a classe ObjectElementManager, responsável por gerenciar o ciclo de vida (criação, atualização, remoção) de uma coleção de entidades de domínio. */
import type { EntityRenderableState } from "../ports/domain-contracts";
import BlackEnemy from "./Entities/Enemies/BlackEnemy";
import Enemy from "./Entities/Enemies/Enemy";
import ObjectElement from "./ObjectElement";

/** * @class ObjectElementManager * Gerencia uma coleção de `ObjectElement`s (como inimigos, itens, projéteis). * Esta classe encapsula a lógica de adicionar, remover, atualizar e acessar * grupos de entidades, permitindo que a `DomainFacade` delegue essa * responsabilidade e permaneça focada na orquestração de alto nível. */
export default class ObjectElementManager {
  /** @private Um mapa que armazena todas as entidades gerenciadas, usando o ID como chave para acesso rápido. */
  private elements: Map<number, ObjectElement> = new Map();
  /** @private Um contador para gerar IDs únicos para novas entidades. Começa em 100 para evitar colisões com IDs estáticos (como o do jogador). */
  private nextId: number = 100;
  

  //? ----------- Methods -----------

  /**
   * Popula o mundo com os elementos iniciais (inimigos, NPCs, itens, etc.).
   * Este método pode ser expandido para ler de uma configuração de nível no futuro.
   */
  public spawnInitialElements(): void {
    
    this.spawn( id => new Enemy(
        id, 
        1,  
        { x: 300, y: 300 }, 
        'enimie', 
        { strength: 10, dexterity: 10, inteligence: 10, wisdown: 10, charisma: 10 }, 
        'idle'
      )
    );


    this.spawn( id =>  new BlackEnemy(
      id,
      0,
      { x: 200, y: 200 },
      "blackEnemy",
      { strength: 10, dexterity: 10, inteligence: 10, wisdown: 10, charisma: 10 }, 
    ))
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

      //? Se tiver update, executa
      if (typeof (element as any).update === 'function') {
        (element as any).update(deltaTime);
      }
    }

  }

  //? ----------- Getters and Setters -----------

  /** * Retorna uma lista de DTOs (`EntityRenderableState`) para todas as entidades gerenciadas. * @returns Um array com o estado renderizável de cada entidade. */
  public getAllRenderableStates(): EntityRenderableState[] {
    const states: EntityRenderableState[] = [];
    for (const element of this.elements.values()) {
      states.push({
        id: element.id,
        entityTypeId: element.objectId,
        coordinates: element.coordinates,
        size: element.size,
        state: element.state,
      });
    }
    return states;
  }
}