import { describe, it, expect } from 'vitest';
import Skill from '../../../domain/Skills/Skill';
import type Effect from '../../../domain/ObjectModule/Items/Effects/Effect';

describe('Skill', () => {
  it('deve construir corretamente com todas as propriedades', () => {
    const mockEffect = {} as Effect;
    const skill = new Skill(
      'fireball',
      'Bola de Fogo',
      'Lança uma bola de fogo.',
      'active',
      1,
      'basic_magic',
      mockEffect,
      'slot_1'
    );

    expect(skill.id).toBe('fireball');
    expect(skill.name).toBe('Bola de Fogo');
    expect(skill.description).toBe('Lança uma bola de fogo.');
    expect(skill.type).toBe('active');
    expect(skill.tier).toBe(1);
    expect(skill.requiredSkillId).toBe('basic_magic');
    expect(skill.effect).toBe(mockEffect);
    expect(skill.keybind).toBe('slot_1');
  });

  it('deve construir corretamente com apenas as propriedades obrigatórias', () => {
    const skill = new Skill(
      'strength_boost',
      'Força Aumentada',
      'Aumenta a força passivamente.',
      'passive',
      1
    );

    expect(skill.id).toBe('strength_boost');
    expect(skill.name).toBe('Força Aumentada');
    expect(skill.tier).toBe(1);
    expect(skill.requiredSkillId).toBeUndefined();
    expect(skill.effect).toBeUndefined();
    expect(skill.keybind).toBeUndefined();
  });
});