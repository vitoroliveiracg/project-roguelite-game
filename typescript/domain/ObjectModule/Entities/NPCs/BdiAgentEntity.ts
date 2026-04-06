import Entity from "../Entity";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type Attributes from "../Attributes";
import type { BdiIntention, IBdiGateway } from "../../../ports/IBdiGateway";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";

/**
 * Entidade controlada por um Motor BDI (Belief-Desire-Intention) externo.
 * NPCs neutros que podem interagir, vagar ou até mesmo atacar dependendo de suas crenças.
 */
export default class BdiAgentEntity extends Entity {
    private currentIntention: BdiIntention = { action: 'idle' };
    private perceptionTimer: number = 0;

    constructor(
        id: number,
        initialCoordinates: { x: number, y: number },
        attributes: Attributes,
        eventManager: IEventManager,
        private bdiGateway: IBdiGateway
    ) {
        // Inicializa como uma Entidade neutra de tamanho padrão 16x16
        super(id, initialCoordinates, { width: 16, height: 16 }, 'bdiAgent', attributes, eventManager);
        
        // Dá um corpo físico ao NPC para que ele exista na QuadTree
        this.hitboxes = [
            new HitBoxCircle(
                { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
                0,
                8,
                (otherElement) => {
                    // No futuro: Lógica de esbarrão, iniciar diálogo ou detectar contato com o Player
                }
            )
        ];
    }

    /** Necessário para a engine reconhecer o NPC como um ser atacável pelas magias do jogador. */
    public onStrike(): any {
        return null;
    }

    /** Chamado pelo Adaptador de Sockets quando o Athena envia uma nova decisão. */
    public setIntention(intention: BdiIntention): void {
        this.currentIntention = intention;
    }

    public override update(deltaTime: number): void {
      this.updateStatuses(deltaTime);

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
            this.updatePosition(); 
      }
        
        // Atualiza fisicamente a hitbox para acompanhar o NPC em movimento
        this.hitboxes?.forEach(hb => hb.updatePosition({ x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 }));
    }
}