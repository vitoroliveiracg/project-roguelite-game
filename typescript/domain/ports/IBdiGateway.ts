/**
 * Estrutura de dados que representa as "Crenças" (Beliefs) atuais do NPC.
 * O Domínio coleta isso da Quadtree e envia para o motor BDI raciocinar.
 */
export interface BdiPerception {
    agentId: number;
    hpPercentage: number;
    playerPosition?: { x: number, y: number };
    nearestItemPos?: { x: number, y: number };
    isColliding: boolean;
}

/**
 * Estrutura de dados que representa as "Intenções" (Intentions) do NPC.
 * O motor BDI envia isso de volta para o Domínio executar.
 */
export interface BdiIntention {
    action: 'idle' | 'move_to' | 'attack' | 'flee';
    targetPos?: { x: number, y: number };
    targetId?: number;
}

/**
 * Porta Secundária para comunicação com o Motor BDI Externo (ex: Athena).
 */
export interface IBdiGateway {
    sendPerceptions(perceptions: BdiPerception): void;
    onIntentionReceived(callback: (intention: BdiIntention) => void): void;
}