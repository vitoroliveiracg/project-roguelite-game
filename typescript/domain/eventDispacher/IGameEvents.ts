import type ObjectElement from "../ObjectModule/ObjectElement";
import type { objectTypeId } from "../ObjectModule/objectType.type";
import type Vector2D from "../shared/Vector2D";

export interface GameEventMap {
  playerMoved: { x: number, y: number };
  playerDied: {};
  spawn: { type: objectTypeId, coordinates: { x: number, y: number }, direction?: Vector2D, attack?: any };
  despawn: { objectId: number };
  levelUp: { newLevel: number };
  requestNeighbors :{ requester: ObjectElement, radius: number, callback: (neighbors :ObjectElement[]) => void };
  log: { channel: string, message: string, params: any[] };
}
export type EventKey = keyof GameEventMap;

export interface IEventManager {
  on<K extends EventKey>(key: K, listener: (payload: GameEventMap[K]) => void): void;
  dispatch<K extends EventKey>(key: K, payload: GameEventMap[K]): void;
}