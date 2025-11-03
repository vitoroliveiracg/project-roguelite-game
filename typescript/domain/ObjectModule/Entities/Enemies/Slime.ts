import { gameEvents } from "../../../eventDispacher/eventDispacher";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import Dice from "../../../shared/Dice";
import Vector2D from "../../../shared/Vector2D";
import type { objectTypeId } from "../../objectType.type";
import Enemy from "./Enemy";
import ObjectElement from "../../ObjectElement";
import Attribute from "../Attributes";

export default class Slime extends Enemy {
  /** @private Armazena a última posição conhecida do jogador para a perseguição. */
  private lastPlayerPos: {x: number; y: number} = {x:0,y:0}
  /** @private Um multiplicador para ajustar a velocidade de movimento específica do Slime. */
  private readonly speedModifier: number = 0.50; // Reduz a velocidade para 50% do valor base.

  //? ----------- Constructor -----------
  constructor(
    id :number,
    level :number,
    baseXp: number,
    coordinates :{ x:number, y:number },
    attributes: Attribute,
    objectId :objectTypeId = "slime",
  ){ 
    super(id, level, baseXp, coordinates, objectId, attributes, "waiting") 
    
    this.hitboxes = [this.setHitbox()];
    this.attributes.hp = (Dice.rollDice(8) * level ) + this.attributes.constitution
      
    this.setEvents();
  }

  //? ----------- Methods -----------

  public update(deltaTime: number): void {
    
    gameEvents.dispatch('requestNeighbors', {
      requester: this,
      radius: this.size.width,
      callback: (neighbors) => this.moveSlime(deltaTime, neighbors)
    });


  }

  private setEvents() {
    gameEvents.on("playerMoved", this.onLastPlayerPos.bind(this) )
  }

  /** * Cria e configura a HitBox do Slime. * A sua principal responsabilidade na colisão é se afastar de outros inimigos * para evitar que fiquem empilhados, usando o método `disperseFrom`. * @returns Uma instância de `HitBoxCircle`. */
  private setHitbox() :HitBoxCircle {
    
    return new HitBoxCircle(
      { x: this.coordinates.x + super.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
      0,
      8,
      (otherElement: ObjectElement) => {

        if (otherElement instanceof Enemy && otherElement.id !== this.id) {
          super.disperseFrom(otherElement)
        }

      }
    )

  }

  /** * Contém a lógica de IA (Inteligência Artificial) para o movimento do Slime. * Ele tenta se mover em direção ao jogador, mas usa uma técnica de "steering" * para desviar de outros Slimes que estejam em seu caminho. Fazendo isso em 5 etapas:  * 1. Define linha reta até a última posição conhecida do jogador.* 2. Verifica se vai colidir simplesmente usando essa reta * 3. Se a rota principal está bloqueada, tenta desviar. * 4. Se tiver bloqueada, tenta para esquerda, depois apra a dieita * 5. Aplica o movimento se uma direção válida foi encontrada. * @param deltaTime O tempo decorrido desde o último frame. * @param neighbors Uma lista de `ObjectElement`s próximos, fornecida pelo `ObjectElementManager`. */
  public moveSlime(deltaTime: number, neighbors: ObjectElement[]): void {
    this.state = 'walking';
  
    //* 1. Define linha reta até a última posição conhecida do jogador.
    const primaryDirection = new Vector2D(
      this.lastPlayerPos.x - this.coordinates.x,
      this.lastPlayerPos.y - this.coordinates.y
    ).normalize();
  
    //* 2. Verifica se vai colidir
    const willCollideInDirection = (direction: Vector2D): boolean => {

      const displacement = direction.multiply(this.attributes.speed * this.speedModifier * deltaTime);
      const nextPosition = { x: this.coordinates.x + displacement.x, y: this.coordinates.y + displacement.y };
      const futureHitbox = new HitBoxCircle({ x: nextPosition.x + this.size.width / 2, y: nextPosition.y + this.size.height / 2 }, 0, 8, () => {});
  
      for (const other of neighbors) {
        if (other instanceof Slime && other.id !== this.id) {
          const otherHitbox = other.hitboxes?.[0];
          if (otherHitbox && futureHitbox.intersects(otherHitbox)) {
            return true;
          }
        }
      }
      return false;
    };
  
    let finalDirection = null;
  
    //* 3. Tenta a direção primária primeiro
    if (!willCollideInDirection(primaryDirection)) {
      finalDirection = primaryDirection;
    } 
    else { //* 4. Se a rota principal está bloqueada, tenta desviar.
      
      //? 45 graus para a esquerda e 45 para a direita.
      const leftDirection = primaryDirection.clone().rotate(-45);
      const rightDirection = primaryDirection.clone().rotate(45);
  
      //* Tenta a rota da esquerda
      if (!willCollideInDirection(leftDirection)) finalDirection = leftDirection; 
      //* Se não der, rota da direita
      else if (!willCollideInDirection(rightDirection)) finalDirection = rightDirection;

      //* Se todas as três direções (frente, esquerda, direita) estiverem bloqueadas, fica parado mesmo
    }
  
    //* 5. Aplica o movimento se uma direção válida foi encontrada.
    if (finalDirection) {
      this.velocity = finalDirection.multiply(this.attributes.speed * this.speedModifier * deltaTime);
      super.updatePosition();
    } 
    else this.velocity.reset();
    
  }

  public onLastPlayerPos( playerCoordinates: {x: number; y: number} ) {
    this.lastPlayerPos.x = playerCoordinates.x
    this.lastPlayerPos.y = playerCoordinates.y

    this.hitboxes?.forEach(hb => hb.update(
      { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }, this.rotation
    ));
  }

}