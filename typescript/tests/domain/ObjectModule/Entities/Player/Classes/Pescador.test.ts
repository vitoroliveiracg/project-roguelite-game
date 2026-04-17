import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Pescador from '../../../../../../domain/ObjectModule/Entities/Player/Classes/Pescador';
import Player from '../../../../../../domain/ObjectModule/Entities/Player/Player';
import Attributes from '../../../../../../domain/ObjectModule/Entities/Attributes';
import DefaultXPTable from '../../../../../../domain/ObjectModule/Entities/DefaultXPTable';
import type { IEventManager } from '../../../../../../domain/eventDispacher/IGameEvents';

const mockEventManager: IEventManager = { on: vi.fn(), dispatch: vi.fn() };
const xpTable = new DefaultXPTable();

describe('Pescador (Física Mecânica)', () => {
  let pescador: Pescador;
  let player: Player;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers(); // Essencial para testar cooldowns baseados em Date.now() e setTimeout
    
    const attrs = new Attributes(8, 1, 10, 10, 10, 10, 10, 10);
    player = new Player(1, { x: 100, y: 100 }, attrs, mockEventManager);
    pescador = new Pescador(xpTable, player, mockEventManager);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deve disparar o anzol se não houver inimigo fisgado e o cooldown permitir', () => {
    // Zera o relógio do sistema para o cooldown bater exato
    vi.setSystemTime(10000); 
    pescador.onLeftClick({ x: 200, y: 200 }, 'leftClick');
    
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('spawn', expect.objectContaining({
      type: 'fishingHook'
    }));
    expect((pescador as any).hookDeployed).toBe(true);

    // Tenta jogar de novo imediatamente
    mockEventManager.dispatch = vi.fn(); // Limpa chamadas antigas
    pescador.onLeftClick({ x: 200, y: 200 }, 'leftClick');
    expect(mockEventManager.dispatch).not.toHaveBeenCalledWith('spawn', expect.anything());
  });

  it('deve invocar Peixinho de Combate respeitando o cooldown', () => {
    player.unlockSkill('pesc_t4_fishpet'); // Habilita a passiva/ativa
    
    vi.setSystemTime(10000);
    pescador.onSummonPet();
    expect(mockEventManager.dispatch).toHaveBeenCalledWith('spawn', expect.objectContaining({ type: 'fishPet' }));

    // Dentro do cooldown de 10s
    vi.setSystemTime(15000); 
    mockEventManager.dispatch = vi.fn();
    pescador.onSummonPet();
    expect(mockEventManager.dispatch).not.toHaveBeenCalledWith('spawn', expect.anything());
  });

  it('deve aplicar Stun no alvo ao fisgar e instanciar timeout de release', () => {
    const dummyTarget = {
      id: 2,
      objectId: 'enemy',
      attributes: { hp: 100 },
      coordinates: { x: 50, y: 50 },
      size: { width: 10, height: 10 },
      applyStatus: vi.fn(),
      activeStatuses: new Map()
    };

    (pescador as any).hookEnemy(dummyTarget);

    expect((pescador as any).hookedEnemy).toBe(dummyTarget);
    expect(dummyTarget.applyStatus).toHaveBeenCalledOnce();
    expect((pescador as any).hookTimeout).not.toBeNull();
  });

  it('deve soltar o inimigo e aplicar retribuição (True Damage) baseada no dano acumulado', () => {
    const dummyTarget = {
      id: 2,
      attributes: { hp: 100 },
      coordinates: { x: 50, y: 50 },
      size: { width: 10, height: 10 },
      activeStatuses: new Map(),
      takeDamage: vi.fn()
    };

    // Anula a entropia de RNG para evitar rolagens de Acerto Crítico que multiplicam o dano final
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

    (pescador as any).hookedEnemy = dummyTarget;
    (pescador as any).accumulatedDamage = 50; // Acumulou atropelamentos
    (pescador as any).releaseEnemy();

    // Como é Retribuição, cria um Attack puro e executa o takeDamage no alvo
    expect(dummyTarget.takeDamage).toHaveBeenCalledWith(expect.objectContaining({
        totalDamage: 50,
        damageType: 'true'
    }));
    expect((pescador as any).hookedEnemy).toBeNull();

    randomSpy.mockRestore();
  });
});