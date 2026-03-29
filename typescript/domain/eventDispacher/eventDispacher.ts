import type { EventKey, GameEventMap, IEventManager } from "./IGameEvents";

/** * Um dispatcher de eventos genérico e com tipagem forte.*/
export class EventHandler implements IEventManager {
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
