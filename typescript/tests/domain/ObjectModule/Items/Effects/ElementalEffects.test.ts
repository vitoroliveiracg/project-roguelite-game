import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Attack from '../../../../../domain/ObjectModule/Items/Attack';
import Dice from '../../../../../domain/shared/Dice';

// Importação de todos os Efeitos Elementais
import AbysEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/AbysEffect';
import AirEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/AirEffect';
import CrystalEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/CrystalEffect';
import DarkEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/DarkEffect';
import DecayEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/DecayEffect';
import FireEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/FireEffect';
import GroundEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/GroundEffect';
import HolyEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/HolyEffect';
import IceEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/IceEffect';
import LightEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/LightEffect';
import MagmaEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/MagmaEffect';
import NatureEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/NatureEffect';
import OrdemEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/OrdemEffect';
import PotenciaEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/PotenciaEffect';
import InfernousEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/InfernousEffect';
import LifeEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/LifeEffect';
import MagicEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/MagicEffect';
import PoisonEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/PoisonEffect';
import ThunderEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/ThunderEffect';
import WaterEffect from '../../../../../domain/ObjectModule/Items/Effects/ElementalEffects/WaterEffect';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number, objectId = 'dummy') {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, objectId as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
  override takeDamage = vi.fn();
  override applyForce = vi.fn();
}

describe('Efeitos Elementais (Alquimia)', () => {
  let source: MockEntity;
  let target: MockEntity;

  beforeEach(() => {
    vi.spyOn(Dice, 'rollDice').mockReturnValue(5); // Garante maxHp fixo de 15
    source = new MockEntity(1);
    target = new MockEntity(2);
    vi.clearAllMocks();
  });

  describe('Status Appliers (Controle de Grupo)', () => {
    it('AbysEffect deve aplicar FearStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new AbysEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'fear' }));
    });

    it('AirEffect deve aplicar SlowStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new AirEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'slow' }));
    });

    it('IceEffect deve aplicar FreezeStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new IceEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'freeze' }));
    });

    it('FireEffect deve aplicar BurnStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new FireEffect(source).apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'burn' }));
    });

    it('DecayEffect deve aplicar DecayStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new DecayEffect(source).apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'decay' }));
    });

    it('InfernousEffect deve aplicar BlindStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new InfernousEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'blind' }));
    });

    it('PoisonEffect deve aplicar PoisonStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new PoisonEffect(source).apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'poison' }));
    });

    it('WaterEffect deve aplicar WetStatus', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new WaterEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'wet' }));
    });

    it('NatureEffect deve aplicar VulnerableStatus sempre e StunStatus com 25% de chance', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.20); // Cai nos 25%
      new NatureEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'vulnerable' }));
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'stun' }));
      randomSpy.mockRestore();
    });

    it('MagicEffect deve aplicar StunStatus com 15% de chance', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.10); // Menor que 15%
      new MagicEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'stun' }));
      
      randomSpy.mockReturnValue(0.20); // Maior que 15%, não aplica
      new MagicEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledTimes(1); // Continua sendo apenas 1 chamada total
      randomSpy.mockRestore();
    });

    it('ThunderEffect deve aplicar ParalyzeStatus com 25% de chance', () => {
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.20); // Menor que 25%
      new ThunderEffect().apply(target);
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'paralyze' }));
      randomSpy.mockRestore();
    });
  });

  describe('Damage Appliers (Matemática Bruta)', () => {
    it('DarkEffect deve aplicar dano True Dark escalado com Inteligência', () => {
      source.attributes.intelligence = 50;
      new DarkEffect(source).apply(target);
      expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({ totalDamage: 60, damageType: 'dark' }));
    });

    it('GroundEffect deve aplicar dano Ground massivo escalado com Inteligência', () => {
      source.attributes.intelligence = 10;
      new GroundEffect(source).apply(target);
      expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({ totalDamage: 15, damageType: 'ground' }));
    });

    it('LightEffect deve aplicar dano escalado com Sabedoria', () => {
      source.attributes.wisdom = 20;
      new LightEffect(source).apply(target);
      expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({ totalDamage: 30, damageType: 'light' }));
    });

    it('HolyEffect deve dobrar o dano apenas em alvos Dark', () => {
      const darkTarget = new MockEntity(3);
      darkTarget.elementalType = 'dark';
      const attack = new Attack(source, 20, 'physical');
      
      new HolyEffect(source, attack).apply(darkTarget); // Aplica no alvo escuro
      new HolyEffect(source, attack).apply(target); // Aplica no alvo normal (dummy)

      expect(darkTarget.takeDamage).toHaveBeenCalledWith(expect.objectContaining({ totalDamage: 20, damageType: 'light' }));
      expect(target.takeDamage).not.toHaveBeenCalled();
    });

    it('LifeEffect deve curar o alvo baseado na inteligência do conjurador', () => {
      target.attributes.hp = 1;
      source.attributes.intelligence = 10;
      new LifeEffect(source).apply(target);
      // Cura de INT * 2 = 20. Total = 21. O Set barra no MaxHP (no caso o maxHp base é 15 do beforeEach do Domínio)
      expect(target.attributes.hp).toBe(15);
    });

    it('MagmaEffect deve aplicar dano físico escalado em STR e infligir BurnStatus', () => {
      source.attributes.strength = 10;
      const applyStatusSpy = vi.spyOn(target, 'applyStatus');
      new MagmaEffect(source).apply(target);
      expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({ totalDamage: 8, damageType: 'physical' })); // 10 * 0.8
      expect(applyStatusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'burn' }));
    });
  });

  describe('Fusion & Mechanics', () => {
    it('CrystalEffect deve fragmentar o feitiço original em 8 direções e impedir recursão', () => {
      const attack = new Attack(source, 80, 'magical');
      const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
      
      new CrystalEffect(mockEventManager, source, attack, ['water', 'crystal']).apply(target);

      expect(dispatchSpy).toHaveBeenCalledTimes(8);
      // Garante que o elemento 'crystal' foi expurgado para evitar Loop Infinito de fragmentação
      expect(dispatchSpy).toHaveBeenCalledWith('spawn', expect.objectContaining({ spellElements: ['water'] }));
    });

    it('OrdemEffect deve aplicar 50% de Dano True, a menos que Caos esteja na receita', () => {
      const attack = new Attack(source, 100, 'magical');
      new OrdemEffect(source, attack, ['water']).apply(target);
      expect(target.takeDamage).toHaveBeenCalledWith(expect.objectContaining({ totalDamage: 50, damageType: 'true' }));

      target.takeDamage = vi.fn(); // Reseta o mock
      new OrdemEffect(source, attack, ['caos']).apply(target);
      expect(target.takeDamage).not.toHaveBeenCalled(); // Anulado por Caos
    });

    it('PotenciaEffect deve aplicar Repulsão Vetorial Extrema (Knockback Force)', () => {
      new PotenciaEffect(source).apply(target);
      expect(target.applyForce).toHaveBeenCalledOnce();
    });
  });
});