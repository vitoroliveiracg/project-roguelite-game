import Entity from "../Entity";
import Vector2D from "../../../shared/Vector2D";
import type { IEventManager } from "../../../eventDispacher/IGameEvents";
import type Attributes from "../Attributes";
import { HitBoxCircle } from "../../../hitBox/HitBoxCircle";
import { PraxisValidator } from "./PraxisValidator";
import type { ILLMService, AI_Plan } from "../../../ports/ILLMService";

/**
 * Entidade Cognitiva que gera e executa o próprio código em tempo de execução.
 */
export class CognitiveNpc extends Entity {
    private thinkTimer: number = 0;
    private thinkInterval: number = 4.0; // A IA "reprograma" a si mesma a cada 4 segundos
    private isThinking: boolean = false;
    private playerRef: Entity | null = null; 
    private lastPlayerMessage: string | null = null; // A última coisa que o jogador falou

    // A função compilada (O "Motor Físico" do momento) que a IA injetou
    private currentCompiledPlan: Function | null = null;
    private llmService: ILLMService | null = null;
    
    // O "Córtex Frontal" do NPC (Onde ele guarda as funções e variáveis que ele mesmo criou)
    private dynamicMethods: Record<string, Function> = {};
    private memory: Record<string, any> = {};
    protected persona: string = "Você é um NPC genérico.";
    protected npcName: string = "Desconhecido";

    constructor(
        id: number,
        initialCoordinates: { x: number, y: number },
        size: { width: number, height: number },
        objectId: string,
        attributes: Attributes,
        eventManager: IEventManager,
        playerRef: Entity | null = null,
        llmService?: ILLMService
    ) {
        super(id, initialCoordinates, size, objectId as any, attributes, eventManager);
        this.playerRef = playerRef;
        if (llmService) this.llmService = llmService;

        this.hitboxes = [
            new HitBoxCircle(
                { x: this.coordinates.x + this.size.width / 2, y: this.coordinates.y + this.size.height / 2 },
                0, Math.max(this.size.width, this.size.height) / 2, () => {}
            )
        ];
    }

    /**
     * Chamado pelo DomainFacade quando o jogador envia uma mensagem no chat para este NPC.
     */
    public receiveMessage(message: string): void {
        this.lastPlayerMessage = message;
        this.triggerThoughtProcess(); // Força a IA a parar e responder/reagir instantaneamente!
    }

    /**
     * O Ciclo de Vida do NPC (Executado a 60 FPS pelo ObjectElementManager)
     */
    public override update(deltaTime: number, player?: any): void {
        if (!this.playerRef && player) this.playerRef = player;
        this.updateStatuses(deltaTime);
        if (this.activeStatuses.has('stun') || this.activeStatuses.has('paralyze')) return;

        // 1. Lógica de Cooldown do Pensamento
        this.thinkTimer -= deltaTime;
        if (this.thinkTimer <= 0 && !this.isThinking) {
            this.triggerThoughtProcess();
        }

        // 2. Executa o Código Gerado pela IA (O Cérebro Reptiliano Dinâmico)
        if (this.currentCompiledPlan && this.playerRef) {
            // Criamos um DTO (Sandbox) seguro. A IA só consegue mexer nesses dados!
            const npcContext = {
                x: this.coordinates.x,
                y: this.coordinates.y,
                dirX: this.direction.x,
                dirY: this.direction.y,
                speed: 0,
                hp: this.attributes.hp,
                memory: this.memory,         // A IA pode ler/escrever aqui livremente
                methods: this.dynamicMethods // A IA pode chamar os métodos que ela mesma inventou aqui
            };
            const playerContext = {
                x: this.playerRef.coordinates.x,
                y: this.playerRef.coordinates.y
            };

            try {
                this.currentCompiledPlan(npcContext, playerContext, deltaTime, Math);
                
                // Recupera a decisão da IA e converte para a matemática real da Engine
                this.direction = new Vector2D(npcContext.dirX, npcContext.dirY).normalizeMut();
                this.velocity = this.direction.clone().multiplyMut(npcContext.speed);
                this.move(deltaTime); // Avança com colisão e atualiza Hitboxes!

                // A IA pode ter inventado uma cura! Refletimos isso de volta na Engine
                this.attributes.hp = Math.min(this.attributes.maxHp, Math.max(0, npcContext.hp));

            } catch (error) {
                console.warn(`[CognitiveNpc ${this.id}] Erro sintático no plano gerado pela IA. Abortando plano atual:`, error);
                this.currentCompiledPlan = null; // Falha segura: para de executar se a IA cometeu um erro de código
            }
        }
    }

    protected override updatePosition(): void {
        super.updatePosition();
        const cx = this.coordinates.x + this.size.width / 2;
        const cy = this.coordinates.y + this.size.height / 2;
        this.hitboxes?.forEach(hb => hb.updatePosition({ x: cx, y: cy }));
    }

    private triggerThoughtProcess(): void {
        this.isThinking = true;
        this.thinkTimer = this.thinkInterval;

        const messageToProcess = this.lastPlayerMessage;
        this.lastPlayerMessage = null; // Limpa a caixa de entrada
        const perceptions = this.gatherPerceptions(messageToProcess);
        
        if (!this.llmService) {
            console.warn(`[CognitiveNpc ${this.id}] Sem ILLMService injetado. IA offline.`);
            this.isThinking = false;
            return;
        }
        
        this.llmService.generatePlan(perceptions, this.persona).then(plan => {
            if (plan) {
                console.log(`[CognitiveNpc ${this.id}] Pensou: ${plan.thought}`);
                
                if (plan.dialogue) {
                    // Aqui você dispara o evento para a UI do Diálogo que fizemos!
                    console.log(`[CognitiveNpc ${this.id}] Disse: ${plan.dialogue}`);
                    this.eventManager.dispatch('npcSpoke', { npcId: this.id, message: plan.dialogue, npcName: this.npcName });
                }

                try {
                    if (plan.new_methods) {
                        for (const [methodName, methodCode] of Object.entries(plan.new_methods)) {
                            // Valida a nova habilidade pelo Praxis antes de aprender
                            const methodValidation = PraxisValidator.validateCode(methodCode);
                            if (!methodValidation.isValid) {
                                console.warn(`[Praxis] Rejeitou a habilidade '${methodName}' gerada pelo LLM: ${methodValidation.reason}`);
                                continue;
                            }
                            
                            // Se passou no Praxis, o NPC aprende de verdade
                            this.dynamicMethods[methodName] = new Function("npc", "player", "deltaTime", "Math", methodCode);
                            console.log(`[CognitiveNpc ${this.id}] Evoluiu! Aprendeu a habilidade: ${methodName}()`);
                        }
                    }

                    // Valida o plano de ação principal
                    const mainValidation = PraxisValidator.validateCode(plan.code);
                    if (!mainValidation.isValid) {
                        console.warn(`[Praxis] Plano principal rejeitado: ${mainValidation.reason}. Mantendo estado anterior.`);
                        // Opcional: Aqui você pode no futuro chamar o Ollama de novo dizendo: "Seu código deu erro, conserte!"
                        this.currentCompiledPlan = null;
                    } else {
                        // Tudo seguro! Injeta no Game Loop!
                        this.currentCompiledPlan = new Function("npc", "player", "deltaTime", "Math", plan.code);
                        console.log(`[CognitiveNpc ${this.id}] Novo código injetado com segurança!`);
                    }
                    
                } catch (e) {
                    console.warn(`[CognitiveNpc ${this.id}] IA gerou um código com erro de compilação:`, e);
                }
            } else {
                // Fallback 1: Retornou null (Ollama mandou um JSON inválido ou alucinou)
                console.warn(`[CognitiveNpc ${this.id}] IA falhou em gerar o plano. Usando fallback.`);
                this.eventManager.dispatch('npcSpoke', { npcId: this.id, message: "*Parece confuso e murmura algo ininteligível...*", npcName: this.npcName });
            }
            this.isThinking = false;
        }).catch(err => {
            console.error(`[CognitiveNpc ${this.id}] Falha ao acessar Ollama:`, err);
            
            // Fallback 2: Erro de Rede, Servidor Offline ou Timeout do AbortController
            this.eventManager.dispatch('npcSpoke', { npcId: this.id, message: "*Olha para o vazio, como se sua mente estivesse em outro mundo...*", npcName: this.npcName });
            
            this.isThinking = false;
        });
    }

    private gatherPerceptions(playerMessage: string | null): string {
        if (!this.playerRef) return "O jogador não está na sua visão.";

        const dist = Math.hypot(this.coordinates.x - this.playerRef.coordinates.x, this.coordinates.y - this.playerRef.coordinates.y);
        const myHpPercent = (this.attributes.hp / this.attributes.maxHp) * 100;

        return `
        ${this.persona}
        - Distância do jogador: ${Math.floor(dist)} pixels.
        - Posição do jogador: X=${Math.floor(this.playerRef.coordinates.x)}, Y=${Math.floor(this.playerRef.coordinates.y)}
        - Sua posição atual: X=${Math.floor(this.coordinates.x)}, Y=${Math.floor(this.coordinates.y)}
        - Sua vida atual: ${Math.floor(myHpPercent)}%
        ${playerMessage ? `- O JOGADOR ACABOU DE TE FALAR ISSO: "${playerMessage}"` : ''}
        `;
    }

}