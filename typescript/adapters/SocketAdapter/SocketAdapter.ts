import type { IBdiGateway, BdiPerception, BdiIntention } from "../../domain/ports/IBdiGateway";
import { logger } from "../web/shared/Logger";

export class SocketAdapter implements IBdiGateway {
    private socket: WebSocket | null = null;
    private intentionCallback: ((intention: BdiIntention) => void) | null = null;

    constructor(private url: string = "ws://localhost:8080") {
        this.connect();
    }

    private connect() {
        try {
            this.socket = new WebSocket(this.url);
            this.socket.onopen = () => logger.log('init', "[Socket] Conectado ao Motor BDI/Athena.");
            this.socket.onmessage = (event) => {
                try {
                    const intention = JSON.parse(event.data) as BdiIntention;
                    if (this.intentionCallback) this.intentionCallback(intention);
                } catch (e) {
                    logger.log('error', "[Socket] Falha ao parsear a intenção da IA.", e);
                }
            };
            this.socket.onclose = () => {
                logger.log('error', "[Socket] Desconectado. Tentando reconectar em 5s...");
                setTimeout(() => this.connect(), 5000);
            };
        } catch (e) {
            logger.log('error', "[Socket] Erro de conexão.", e);
        }
    }

    public sendPerceptions(perceptions: BdiPerception): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(perceptions));
        }
    }

    public onIntentionReceived(callback: (intention: BdiIntention) => void): void {
        this.intentionCallback = callback;
    }
}