export interface GameEventMap {
  entityPositionChanged: { entityId: string; x: number; y: number };
  playerMoved: {x: number; y: number};
  entityCreated: { entityId: string; initialX: number; initialY: number };
  log: {  };
  messageReceived: { message :string };
  enemyDied: { xpGiven: number; killerId: number };
}

export type EventKey = keyof GameEventMap;

/** * Um dispatcher de eventos genérico e com tipagem forte.*/
class EventHandler {
  private listeners: { [K in EventKey]?: ((payload: GameEventMap[K]) => void)[] } = {};

  /**
   * Registra um ouvinte para um evento específico.
   * @param key O nome do evento.
   * @param listener A função a ser chamada quando o evento for disparado.
   */
  on<K extends EventKey>(key: K, listener: (payload: GameEventMap[K]) => void): void {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key]!.push(listener);
  }

  /**
   * Dispara um evento, notificando todos os ouvintes registrados.
   * @param key O nome do evento.
   * @param payload Os dados a serem enviados para os ouvintes.
   */
  dispatch<K extends EventKey>(key: K, payload: GameEventMap[K]): void {
    this.listeners[key]?.forEach(listener => listener(payload));
  }
}



export const gameEvents = new EventHandler();

gameEvents.on("log", ()=>{
  gameEvents.dispatch("messageReceived", { message : "oii" })
})