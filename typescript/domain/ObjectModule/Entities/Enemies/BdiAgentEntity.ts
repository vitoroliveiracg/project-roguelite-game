import Enemy from "./Enemy";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type Attributes from "../Attributes";
import type { BdiIntention, IBdiGateway } from "../../../ports/IBdiGateway";
import Vector2D from "../../../shared/Vector2D";

/**
 * Entidade controlada por um Motor BDI (Belief-Desire-Intention) externo.
 * Não possui IA "hardcoded". Seu comportamento é ditado pelas intenções que recebe.
 */
export default class BdiAgentEntity extends Enemy {
    private currentIntention: BdiIntention = { action: 'idle' };
    private perceptionTimer: number = 0;

    constructor(
        id: number,
        initialCoordinates: { x: number, y: number },
        attributes: Attributes,
        eventManager: IEventManager,
        private bdiGateway: IBdiGateway
    ) {
        super(id, 1, 50, initialCoordinates, 'bdiAgent' as any, attributes, eventManager);
    }

    /** Chamado pelo Adaptador de Sockets quando o Athena envia uma nova decisão. */
    public setIntention(intention: BdiIntention): void {
        this.currentIntention = intention;
    }

    public override update(deltaTime: number): void {
      // Envia percepções para o Motor BDI a cada ~0.5 segundos para não inundar o Socket
      this.perceptionTimer += deltaTime;
      if (this.perceptionTimer >= 0.5) {
          this.perceptionTimer = 0;
          this.bdiGateway.sendPerceptions({
              agentId: this.id,
              hpPercentage: this.attributes.hp / this.attributes.maxHp,
              isColliding: false // Isso seria alimentado pelo sistema de colisão
          });
      }

      // Executa fisicamente a intenção atual (O Motor de Jogo atua como o "Corpo" do Agente)
      if ((this.currentIntention.action === 'move_to' || this.currentIntention.action === 'flee') && this.currentIntention.targetPos) {
          this.direction.x = this.currentIntention.targetPos.x - this.coordinates.x;
          this.direction.y = this.currentIntention.targetPos.y - this.coordinates.y;
          this.velocity = this.direction.clone().normalizeMut().multiplyMut(this.attributes.speed * deltaTime);
          (this as any).updatePosition(); // Invoca a atualização de posição interna da Entity
      }
    }
}