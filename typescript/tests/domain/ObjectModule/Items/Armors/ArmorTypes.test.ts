import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Player from '../../../../../domain/ObjectModule/Entities/Player/Player';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Dice from '../../../../../domain/shared/Dice';
import type { DamageInfo } from '../../../../../domain/ObjectModule/Entities/Entity';
import IronBoots from '../../../../../domain/ObjectModule/Items/Armors/boots/IronBoots';
import IronChestplate from '../../../../../domain/ObjectModule/Items/Armors/chestplates/IronChestplate';
import IronGloves from '../../../../../domain/ObjectModule/Items/Armors/glooves/IronGloves';
import IronHelmet from '../../../../../domain/ObjectModule/Items/Armors/helmet/IronHelmet';
import IronPants from '../../../../../domain/ObjectModule/Items/Armors/pants/IronPants';
import Vector2D from '../../../../../domain/shared/Vector2D';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

describe('Integração de Armaduras e Redução de Dano', () => {
  let player: Player;
  let randomSpy: any;

  // Função construtora auxiliar para blindar o DTO e evitar erros vetoriais (Undefined Vector2D) em entidades que sobrevivem ao dano
  const getDamagePayload = (amount: number): DamageInfo => ({
    totalDamage: amount,
    damageType: 'physical',
    isCritical: false,
    direction: new Vector2D(0, 0),
    attacker: {} as any
  });

  beforeEach(() => {
    vi.spyOn(Dice, 'rollDice').mockReturnValue(8); // HP determinístico (18)
    const attrs = new Attributes(8, 1, 10, 10, 10, 10, 10, 10); // Defesa base = 2
    player = new Player(1, { x: 0, y: 0 }, attrs, mockEventManager);
    
    // Garante que não haverá esquiva (a menos que o teste manipule o spy)
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0); 
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('deve receber dano quase total (apenas com defesa base) sem nenhuma armadura equipada', () => {
    const damageDealt = player.takeDamage(getDamagePayload(100));
    // Dano final = 100 (base) - 2 (defesa) = 98
    expect(damageDealt).toBe(98);
  });

  it('IronHelmet (5% DR) deve reduzir o dano corretamente', () => {
    player.equipment.helmet = new IronHelmet();
    const damageDealt = player.takeDamage(getDamagePayload(100));
    // Dano reduzido = 100 * (1 - 0.05) = 95
    // Dano final = 95 - 2 (defesa) = 93
    expect(damageDealt).toBe(93);
  });

  it('IronChestplate (15% DR, -2% Dodge) deve reduzir o dano e a esquiva', () => {
    player.equipment.chestplate = new IronChestplate();
    const damageDealt = player.takeDamage(getDamagePayload(100));
    // Dano reduzido = 100 * (1 - 0.15) = 85
    // Dano final = 85 - 2 (defesa) = 83
    expect(damageDealt).toBe(83);

    // Validação de Dodge: Força a base para 50 para absorver a penalidade e garantir chance > 0
    Object.defineProperty(player.attributes, 'dodge', { value: 50, configurable: true }); 
    randomSpy.mockReturnValue(0.0); // 0 < 48 = true (Esquiva Garantida)
    const dodgedDamage = player.takeDamage(getDamagePayload(100));
    expect(dodgedDamage).toBe(0);
  });

  it('deve acumular a redução de dano de um conjunto completo de armadura', () => {
    player.equipment.helmet = new IronHelmet();         // 5%
    player.equipment.chestplate = new IronChestplate(); // 15%
    player.equipment.pants = new IronPants();           // 10%
    player.equipment.boots = new IronBoots();           // 5%
    player.equipment.gloves = new IronGloves();         // 3%
    // Total DR = 38%

    const damageDealt = player.takeDamage(getDamagePayload(100));
    // Dano reduzido = 100 * (1 - 0.38) = 62
    // Dano final = 62 - 2 (defesa) = 60
    expect(damageDealt).toBe(60);
  });

  it('deve capar a redução de dano em 90% para evitar imortalidade', () => {
    // Equipando um item customizado com DR acima do limite
    const godArmor = { damageReductionPercent: 100, dodgePercent: 0 };
    player.equipment.chestplate = godArmor as any;
    
    const damageDealt = player.takeDamage(getDamagePayload(100));
    // Dano reduzido = 100 * (1 - 0.90) = 10 (capado em 90%)
    // Dano final = 10 - 2 (defesa) = 8
    expect(damageDealt).toBeCloseTo(8);
  });
});