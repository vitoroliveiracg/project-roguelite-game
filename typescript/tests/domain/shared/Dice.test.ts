import { describe, it, expect, vi, afterEach } from 'vitest';
import Dice from '../../../domain/shared/Dice';

describe('Dice', () => {

  afterEach(() => {
    // Restaura o mock após cada teste para não afetar outros testes
    vi.restoreAllMocks();
  });

  it('deve retornar 1 quando Math.random() retorna 0 (limite inferior)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const faces = 6;
    const result = Dice.rollDice(faces);
    expect(result).toBe(1);
  });

  it('deve retornar o número máximo de faces quando Math.random() retorna um valor próximo de 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999999);
    const faces = 20;
    const result = Dice.rollDice(faces);
    expect(result).toBe(faces);
  });

  it('deve retornar um valor intermediário correto', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const faces = 10;
    // Math.floor(0.5 * 10) + 1 = 5 + 1 = 6
    const result = Dice.rollDice(faces);
    expect(result).toBe(6);
  });

  it('deve sempre retornar um número inteiro dentro do intervalo [1, faces]', () => {
    const faces = 100;
    for (let i = 0; i < 1000; i++) {
      const result = Dice.rollDice(faces);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(faces);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});