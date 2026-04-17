import { describe, it, expect, vi, beforeEach } from 'vitest';
import Entity from '../../../../../domain/ObjectModule/Entities/Entity';
import Attributes from '../../../../../domain/ObjectModule/Entities/Attributes';
import Player from '../../../../../domain/ObjectModule/Entities/Player/Player';
import type { IEventManager } from '../../../../../domain/eventDispacher/IGameEvents';
import Dice from '../../../../../domain/shared/Dice';

import AddCoinsEffect from '../../../../../domain/ObjectModule/Items/Effects/AddCoinsEffect';
import AttributeBoostEffect from '../../../../../domain/ObjectModule/Items/Effects/AttributeBoostEffect';
import ExperienceEffect from '../../../../../domain/ObjectModule/Items/Effects/ExperienceEffect';
import HealEffect from '../../../../../domain/ObjectModule/Items/Effects/HealEffect';
import ManaRestoreEffect from '../../../../../domain/ObjectModule/Items/Effects/ManaRestoreEffect';
import PowerBoostEffect from '../../../../../domain/ObjectModule/Items/Effects/PowerBoostEffect';
import SizeBoostEffect from '../../../../../domain/ObjectModule/Items/Effects/SizeBoostEffect';
import SpeedBoostEffect from '../../../../../domain/ObjectModule/Items/Effects/SpeedBoostEffect';
import VampirismEffect from '../../../../../domain/ObjectModule/Items/Effects/VampirismEffect';
import VisualEffect from '../../../../../domain/ObjectModule/Items/Effects/VisualEffect/VisualEffect';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };

class MockEntity extends Entity {
  constructor(id: number) {
    super(id, { x: 0, y: 0 }, { width: 10, height: 10 }, 'dummy' as any, new Attributes(8, 1, 10, 10, 10, 10, 10, 10), mockEventManager);
  }
  update() {}
}

describe('Effects - Base Mechanics', () => {
  let target: MockEntity;
  let player: Player;

  beforeEach(() => {
    vi.spyOn(Dice, 'rollDice').mockReturnValue(5); // maxHp fixo em 15
    target = new MockEntity(1);
    player = new Player(2, { x: 0, y: 0 }, new Attributes(8, 1, 10, 10, 10, 10, 0, 10), mockEventManager);
    vi.clearAllMocks();
  });

  it('AddCoinsEffect deve adicionar moedas apenas se a entidade tiver uma carteira (Player)', () => {
    const effect = new AddCoinsEffect(50);
    effect.apply(player);
    expect(player.coins).toBe(50);

    // Não deve quebrar ao aplicar em NPC/Inimigo
    expect(() => effect.apply(target)).not.toThrow();
  });

  it('ExperienceEffect deve conceder XP apenas se a entidade puder receber (Player)', () => {
    const effect = new ExperienceEffect(100);
    const gainXpSpy = vi.spyOn(player, 'gainXp');
    effect.apply(player);
    expect(gainXpSpy).toHaveBeenCalledWith(100);
  });

  it('AttributeBoostEffect deve aumentar permanentemente um atributo base', () => {
    const effect = new AttributeBoostEffect('strength', 5);
    const initialStrength = target.attributes.strength;
    effect.apply(target);
    expect(target.attributes.strength).toBe(initialStrength + 5);
  });

  it('HealEffect deve curar HP respeitando o cap máximo e despachar log', () => {
    target.attributes.hp = 1;
    const effect = new HealEffect(10);
    const logSpy = vi.spyOn(mockEventManager, 'dispatch');
    
    effect.apply(target);
    expect(target.attributes.hp).toBe(11);
    expect(logSpy).toHaveBeenCalledWith('log', expect.objectContaining({ message: 'Healed for 10 HP.' }));
  });

  it('ManaRestoreEffect deve restaurar mana', () => {
    target.attributes.mana = 10;
    const effect = new ManaRestoreEffect(20);
    effect.apply(target);
    expect(target.attributes.mana).toBe(30);
  });

  it('PowerBoostEffect deve injetar força e despachar partícula', () => {
    const effect = new PowerBoostEffect(10);
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    effect.apply(target);
    expect(target.attributes.strength).toBe(20);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'fireExplosion' }));
  });

  it('SizeBoostEffect deve injetar bonusArea (setter dinâmico) e despachar partícula', () => {
    const effect = new SizeBoostEffect(15);
    Object.defineProperty(target.attributes, 'bonusArea', { value: 0, writable: true, configurable: true });
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    effect.apply(target);
    expect((target.attributes as any).bonusArea).toBe(15);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'levelUp' }));
  });

  it('SpeedBoostEffect deve injetar bônus de velocidade e despachar partícula', () => {
    const effect = new SpeedBoostEffect(50);
    const initialSpeed = target.attributes.speed;
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    effect.apply(target);
    expect(target.attributes.speed).toBe(initialSpeed + 50);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'magicAura', color: '#00FFFF' }));
  });

  it('VampirismEffect deve injetar Lifesteal e despachar partícula', () => {
    const effect = new VampirismEffect(10);
    Object.defineProperty(target.attributes, 'lifesteal', { value: 0, writable: true, configurable: true });
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    effect.apply(target);
    expect((target.attributes as any).lifesteal).toBe(10);
    expect(dispatchSpy).toHaveBeenCalledWith('particle', expect.objectContaining({ effect: 'levelUp', color: '#8a0303' }));
  });

  it('VisualEffect deve despachar evento spawnVisual com coordenadas centralizadas', () => {
    const effect = new VisualEffect(mockEventManager, 'explosion', 1.5, { width: 20, height: 20 });
    const dispatchSpy = vi.spyOn(mockEventManager, 'dispatch');
    effect.apply(target);
    expect(dispatchSpy).toHaveBeenCalledWith('spawnVisual', expect.objectContaining({
      type: 'explosion',
      duration: 1.5,
      size: { width: 20, height: 20 }
    }));
  });
});