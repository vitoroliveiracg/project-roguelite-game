import type ObjectElement from "../ObjectModule/ObjectElement";

export interface GameEventMap {
  playerMoved: {x: number; y: number};
  spawn: { factory: (id: number) => ObjectElement; onSpawned?: (newObject: ObjectElement) => void };
  despawn: { objectId: number };
}
export type EventKey = keyof GameEventMap;