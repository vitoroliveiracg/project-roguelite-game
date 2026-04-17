import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnimatedMeleeAttack, { type AnimatedAttackConfig } from '../../../../../domain/ObjectModule/Items/Weapons/MeleeWeapons/AnimatedMeleeAttack';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Vector2D from '../../../../../domain/shared/Vector2D';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number, x: number, y: number) {
    super(id, { x, y }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
  override takeDamage = vi.fn();
}

// Simulação de JSON gerado pelo Hitbox Editor
const MOCK_HITBOX_JSON = [
    // Frame 0
    [ { id: "p0", type: "polygon", coordinates: {x: 0, y: 0}, rotation: 0, points: [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}] } ],
    // Frame 1
    [ { id: "p1", type: "polygon", coordinates: {x: 20, y: 0}, rotation: 0, points: [{x: 20, y: 0}, {x: 30, y: 0}, {x: 30, y: 10}] } ]
];

const MOCK_CONFIG: AnimatedAttackConfig = {
    width: 32,
    height: 32,
    typeId: 'mock-slash',
    totalFrames: 2,
    frameDuration: 0.1, // 100ms por frame
    pivot: { x: 0, y: 0 },
    scale: 1.0,
    originalFrameWidth: 20,
    rawHitboxes: MOCK_HITBOX_JSON as any,
    rotationOffset: 0
};

class DummyAnimatedAttack extends AnimatedMeleeAttack {
    constructor(id: number, payload: any) {
        super(id, payload, mockEventManager, MOCK_CONFIG);
    }
    public getHitboxes() { return this.hitboxesPerFrame; }
}

describe('AnimatedMeleeAttack', () => {
  let attacker: MockEntity;
  let attack: Attack;
  let payload: any;

  beforeEach(() => {
    attacker = new MockEntity(1, 100, 100);
    attack = new Attack(attacker, 50, 'physical');
    payload = {
        attacker,
        attack,
        direction: new Vector2D(1, 0),
        coordinates: { x: 100, y: 100 }
    };
    vi.clearAllMocks();
  });

  it('deve sincronizar a própria posição com o centro do atacante', () => {
    const animated = new DummyAnimatedAttack(100, payload);
    // pCenterX = 100 + 5 = 105. pCenterY = 100 + 5 = 105.
    // this.y = pCenterY - config.height (105 - 32 = 73)
    expect(animated.coordinates.x).toBe(105);
    expect(animated.coordinates.y).toBe(73);
  });

  it('deve iterar os arrays de Hitboxes com base no deltaTime e vida útil', () => {
    const animated = new DummyAnimatedAttack(100, payload);
    
    // Frame 0 (t = 0)
    animated.update(0.01);
    expect(animated.hitboxes).toBe(animated.getHitboxes()[0]);

    // Frame 1 (t > 0.1s)
    animated.update(0.1);
    expect(animated.hitboxes).toBe(animated.getHitboxes()[1]);
  });

  it('deve acionar autodestruição ao ultrapassar todos os frames', () => {
    const animated = new DummyAnimatedAttack(100, payload);
    const destroySpy = vi.spyOn(animated as any, 'destroy');

    animated.update(0.1); // Frame 1
    animated.update(0.11); // Fim de ciclo
    
    expect(destroySpy).toHaveBeenCalledOnce();
  });
});