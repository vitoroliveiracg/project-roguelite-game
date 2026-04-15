// import type { IBdiGateway, BdiPerception, BdiIntention } from "../../domain/ports/IBdiGateway";
// import { logger } from "../web/shared/Logger";

// export class SocketAdapter implements IBdiGateway {
//     private socket: WebSocket | null = null;
//     private intentionCallback: ((intention: BdiIntention) => void) | null = null;
//     private reconnectAttempts: number = 0;
//     private readonly MAX_RECONNECT_ATTEMPTS: number = 3;

//     constructor(private url: string = "ws://localhost:8080") {
//         this.connect();
//     }

//     private connect() {
//         if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
//             logger.log('error', "[Socket] Limite de tentativas atingido. IA dos NPCs desativada nesta sessão.");
//             return;
//         }

//         try {
//             this.socket = new WebSocket(this.url);
            
//             this.socket.onopen = () => {
//                 logger.log('init', "[Socket] Conectado ao Motor BDI/Athena.");
//                 this.reconnectAttempts = 0; // Reseta as tentativas após conexão bem-sucedida
//             };
            
//             this.socket.onmessage = (event) => {
//                 try {
//                     const intention = JSON.parse(event.data) as BdiIntention;
//                     if (this.intentionCallback) this.intentionCallback(intention);
//                 } catch (e) {
//                     logger.log('error', "[Socket] Falha ao parsear a intenção da IA.", e);
//                 }
//             };
            
//             this.socket.onerror = (error) => {
//                 // Previne que erros de recusa de conexão estoorem como exceções não capturadas no console
//                 logger.log('error', "[Socket] Falha na conexão com o servidor BDI.");
//             };

//             this.socket.onclose = () => {
//                 this.reconnectAttempts++;
//                 if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
//                     logger.log('error', `[Socket] Desconectado. Tentando reconectar em 5s... (Tentativa ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);
//                     setTimeout(() => this.connect(), 5000);
//                 } else {
//                     logger.log('error', "[Socket] O servidor de IA (Athena) está offline. O jogo rodará normalmente, mas os NPCs estarão inativos.");
//                 }
//             };
//         } catch (e) {
//             logger.log('error', "[Socket] Erro de conexão.", e);
//         }
//     }

//     public sendPerceptions(perceptions: BdiPerception): void {
//         if (this.socket && this.socket.readyState === WebSocket.OPEN) {
//             this.socket.send(JSON.stringify(perceptions));
//         }
//     }

//     public onIntentionReceived(callback: (intention: BdiIntention) => void): void {
//         this.intentionCallback = callback;
//     }
// }