import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Attack from '../../../../domain/ObjectModule/Items/Attack';
import Entity from '../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../domain/ObjectModule/Entities/Attributes';
import Vector2D from '../../../../domain/shared/Vector2D';
import type { IEventManager } from '../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number, objectId: string = 'dummy') {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, objectId as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
  // Mock simplificado de takeDamage para facilitar os cálculos de lifesteal
  override takeDamage = vi.fn().mockImplementation((info) => info.totalDamage);
}

describe('Attack', () => {
  let attacker: MockEntity;
  let attackerWithHighStr: MockEntity;
  let target: MockEntity;

  beforeEach(() => {
    attacker = new MockEntity(1, 'player');
    target = new MockEntity(2, 'enemy');
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Cria uma segunda entidade com atributos modificados para isolar os testes de escala
    attackerWithHighStr = new MockEntity(3, 'player');
    attackerWithHighStr.attributes.strength = 20; // +10 de dano bônus (20 * 0.5)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve aplicar dano físico escalado com força', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0); // Sem crítico

    const attack = new Attack(attackerWithHighStr, 10, 'physical');
    attack.execute(target, new Vector2D(1, 0));

    expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({
      totalDamage: 20, // 10 base + 10 bônus
      damageType: 'physical',
      isCritical: false
    }));

    randomSpy.mockRestore();
  });

  it('deve aplicar dano mágico escalado com inteligência', () => {
    const attackerWithHighInt = new MockEntity(4, 'player');
    attackerWithHighInt.attributes.intelligence = 30; // +15 de dano bônus (30 * 0.5)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0); // Sem crítico

    const attack = new Attack(attackerWithHighInt, 10, 'magical');
    attack.execute(target, new Vector2D(1, 0));

    expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({
      totalDamage: 25, // 10 base + 15 bônus
      damageType: 'magical'
    }));

    randomSpy.mockRestore();
  });

  it('deve aplicar multiplicador de dano crítico', () => {
    // Força o getter do critDamage para retornar 200% (2.0x)
    Object.defineProperty(attacker.attributes, 'critDamage', { value: 200, configurable: true });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.0); // Crítico garantido

    const attack = new Attack(attacker, 10, 'physical');
    attack.execute(target, new Vector2D(1, 0));

    expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({
      totalDamage: 30, // 10 base + 5 str_bonus = 15 * 2.0 (crit) = 30
      isCritical: true
    }));

    randomSpy.mockRestore();
  });

  it('deve curar o atacante (Lifesteal) baseado no dano real causado', () => {
    attacker.attributes.hp = 1;
    Object.defineProperty(attacker.attributes, 'lifesteal', { value: 50, configurable: true }); // 50% de roubo de vida
    
    // Simulamos que o takeDamage retornou 10 de dano REAL. O atacante deve curar 5.
    target.takeDamage = vi.fn().mockReturnValue(10);

    const attack = new Attack(attacker, 10, 'physical');
    attack.execute(target, new Vector2D(1, 0));

    expect(attacker.attributes.hp).toBe(6); // 1 + 5
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'magicAura', color: '#ff2a2a' }));
  });

  it('deve executar OnHitActions dinâmicas (Zero-GC Polimorfismo)', () => {
    const mockOnHitAction = vi.fn();
    const attack = new Attack(attacker, 10, 'physical', [mockOnHitAction]);
    
    target.takeDamage = vi.fn().mockReturnValue(10);
    attack.execute(target, new Vector2D(1, 0));

    expect(mockOnHitAction).toHaveBeenCalledOnce();
    expect(mockOnHitAction).toHaveBeenCalledWith(attacker, target, 10);
  });

  it('deve resetar a força vetorial (accelerator) do atacante após 150ms', () => {
    const resetSpy = vi.spyOn(attacker, 'resetAccelerator');
    const attack = new Attack(attacker, 10, 'physical');
    attack.execute(target, new Vector2D(1, 0));
    vi.advanceTimersByTime(150);
    expect(resetSpy).toHaveBeenCalledOnce();
  });
});