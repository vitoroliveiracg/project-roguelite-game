import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatusEffect from '../../../../../domain/ObjectModule/Entities/Status/StatusEffect';
import type Entity from '../../../../../domain/ObjectModule/Entities/Entity';

class MockConcreteStatus extends StatusEffect {
  override onApply = vi.fn();
  override onTick = vi.fn();
  override onRemove = vi.fn();
}

const mockTarget = {} as Entity;

describe('StatusEffect (Abstract)', () => {
  let status: MockConcreteStatus;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar onApply ao ser aplicado', () => {
    status = new MockConcreteStatus('test', 'desc', 5);
    status.apply(mockTarget);
    expect(status.onApply).toHaveBeenCalledWith(mockTarget);
  });

  it('deve incrementar o tempo decorrido e o timer de tick a cada update', () => {
    status = new MockConcreteStatus('test', 'desc', 5, 1);
    status.update(0.5, mockTarget);
    expect(status.elapsed).toBe(0.5);
    expect(status.tickTimer).toBe(0.5);
  });

  it('deve chamar onTick quando o intervalo de tick for atingido', () => {
    status = new MockConcreteStatus('test', 'desc', 5, 1);
    status.update(1.1, mockTarget); // Passa do intervalo de 1s
    expect(status.onTick).toHaveBeenCalledOnce();
    expect(status.onTick).toHaveBeenCalledWith(mockTarget);
    expect(status.tickTimer).toBeCloseTo(0.1); // Reseta o timer
  });

  it('não deve chamar onTick se o intervalo for 0', () => {
    status = new MockConcreteStatus('test', 'desc', 5, 0);
    status.update(1.0, mockTarget);
    expect(status.onTick).not.toHaveBeenCalled();
  });

  it('deve retornar false se a duração não tiver acabado', () => {
    status = new MockConcreteStatus('test', 'desc', 5);
    const isFinished = status.update(4.9, mockTarget);
    expect(isFinished).toBe(false);
    expect(status.onRemove).not.toHaveBeenCalled();
  });

  it('deve retornar true e chamar onRemove quando a duração expirar', () => {
    status = new MockConcreteStatus('test', 'desc', 5);
    const isFinished = status.update(5.1, mockTarget);
    expect(isFinished).toBe(true);
    expect(status.onRemove).toHaveBeenCalledOnce();
    expect(status.onRemove).toHaveBeenCalledWith(mockTarget);
  });
});