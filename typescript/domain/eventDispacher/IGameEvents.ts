import type ObjectElement from "../ObjectModule/ObjectElement";

export interface GameEventMap {
  playerMoved: { x: number, y: number };
  playerDied: {};
  spawn: { factory: (id: number) => ObjectElement; onSpawned?: (newObject: ObjectElement) => void };
  despawn: { objectId: number };
  requestNeighbors :{ requester: ObjectElement, radius: number, callback: (neighbors :ObjectElement[]) => void };
  log: { channel: string, message: string, params: any[] };
}
export type EventKey = keyof GameEventMap;

export interface IEventManager {
  on<K extends EventKey>(key: K, listener: (payload: GameEventMap[K]) => void): void;
  dispatch<K extends EventKey>(key: K, payload: GameEventMap[K]): void;
}