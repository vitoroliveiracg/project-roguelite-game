import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActionManager from '../../../domain/eventDispacher/ActionManager';
import { ClassActionBindings } from '../../../domain/eventDispacher/ActionBindings';
import type Player from '../../../domain/ObjectModule/Entities/Player/Player';
import type { ILogger } from '../../../domain/ports/ILogger';
import type { IEventManager } from '../../../domain/eventDispacher/IGameEvents';

class MockLogger implements ILogger {
  log = vi.fn();
}

class MockEventManager implements IEventManager {
  private listeners: Record<string, Function[]> = {};
  on = vi.fn((key, cb) => {
    if (!this.listeners[key]) this.listeners[key] = [];
    this.listeners[key].push(cb);
  });
  dispatch = vi.fn((key, payload) => {
    this.listeners[key]?.forEach(cb => cb(payload));
  });
}

describe('ActionManager', () => {
  let player: any;
  let logger: MockLogger;
  let eventManager: MockEventManager;
  let actionManager: ActionManager;

  beforeEach(() => {
    ClassActionBindings.clear();
    
    player = {
      constructor: { name: 'PlayerClass' },
      activeClass: 'WarriorClass',
      classes: [{
        constructor: { name: 'WarriorClass' },
        slash: vi.fn(),
        name: 'WarriorClass'
      }],
      activeLoadout: ['magicMissile', null, null, null],
      executeActiveSkill: vi.fn(),
      moveUp: vi.fn()
    };

    // Forçando a simulação dos Bindings que teriam sido gerados via Decorator no Runtime
    const pBindings = new Map();
    pBindings.set('up', 'moveUp');
    ClassActionBindings.set('PlayerClass', pBindings);

    const wBindings = new Map();
    wBindings.set('spell_1', 'slash');
    ClassActionBindings.set('WarriorClass', wBindings);

    logger = new MockLogger();
    eventManager = new MockEventManager();
    actionManager = new ActionManager(player as unknown as Player, logger, eventManager);
  });

  it('deve rotear uma ação básica da classe do Player', () => {
    actionManager.checkEvent(['up'], { x: 10, y: 10 });
    expect(player.moveUp).toHaveBeenCalledOnce();
    expect(player.moveUp).toHaveBeenCalledWith({ x: 10, y: 10 }, 'up');
  });

  it('deve rotear uma ação sobrescrita/adicionada pela Classe Ativa do Player', () => {
    actionManager.checkEvent(['spell_1'], { x: 20, y: 20 });
    expect(player.classes[0].slash).toHaveBeenCalledOnce();
    expect(player.classes[0].slash).toHaveBeenCalledWith({ x: 20, y: 20 }, 'spell_1');
  });

  it('deve rotear ações dinâmicas de Loadout (Deck Building) para executeActiveSkill', () => {
    actionManager.checkEvent(['slot_1'], { x: 30, y: 30 });
    expect(player.executeActiveSkill).toHaveBeenCalledOnce();
    expect(player.executeActiveSkill).toHaveBeenCalledWith('magicMissile', { x: 30, y: 30 });
  });

  it('não deve fazer nada se o slot de Loadout estiver vazio', () => {
    actionManager.checkEvent(['slot_2'], { x: 30, y: 30 });
    expect(player.executeActiveSkill).not.toHaveBeenCalled();
  });

  it('deve reconstruir os bindings ao receber o evento classChanged', () => {
    player.activeClass = 'MageClass';
    player.classes.push({
      constructor: { name: 'MageClass' },
      castMagic: vi.fn(),
      name: 'MageClass'
    });

    const mBindings = new Map();
    mBindings.set('spell_1', 'castMagic');
    ClassActionBindings.set('MageClass', mBindings);

    eventManager.dispatch('classChanged', {} as any);

    // O botão 'spell_1' agora deve acionar o MageClass e não mais o WarriorClass
    actionManager.checkEvent(['spell_1'], { x: 40, y: 40 });
    expect(player.classes[1].castMagic).toHaveBeenCalledOnce();
    expect(player.classes[0].slash).not.toHaveBeenCalled();
  });
});