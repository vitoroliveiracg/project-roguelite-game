import { describe, it, expect } from 'vitest';
import DefaultXPTable from '../../../../domain/ObjectModule/Entities/DefaultXPTable';

describe('DefaultXPTable', () => {
  const xpTable = new DefaultXPTable();

  it('deve retornar 1 ponto de atributo para um nível normal (ímpar)', () => {
    const rewards = xpTable.getRewardsForLevel(3);
    expect(rewards).toEqual(['attribute_point']);
  });

  it('deve retornar 1 ponto de atributo e 1 skill de classe para um nível par', () => {
    const rewards = xpTable.getRewardsForLevel(4);
    expect(rewards).toEqual(['attribute_point', 'class_skill']);
  });

  it('deve retornar 3 pontos de atributo para um nível múltiplo de 5 (ímpar)', () => {
    const rewards = xpTable.getRewardsForLevel(5);
    expect(rewards).toEqual(['attribute_point', 'attribute_point', 'attribute_point']);
  });

  it('deve retornar 3 pontos de atributo e 1 skill de classe para um nível múltiplo de 5 e par', () => {
    const rewards = xpTable.getRewardsForLevel(10);
    expect(rewards).toEqual(['attribute_point', 'attribute_point', 'attribute_point', 'class_skill']);
  });
});