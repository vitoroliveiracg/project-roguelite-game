import { describe, it, expect } from 'vitest';
import LeatherBag from '../../../../../domain/ObjectModule/Items/Storage/LeatherBag';

describe('LeatherBag', () => {
  it('deve ser instanciada com os atributos corretos de uma mochila de couro', () => {
    const leatherBag = new LeatherBag();
    
    expect(leatherBag.name).toBe('Mochila de Aventureiro');
    expect(leatherBag.capacityBonus).toBe(12);
    expect(leatherBag.rarity).toBe('uncommon');
    expect(leatherBag.price).toBe(150);
    expect(leatherBag.category).toBe('storage');
  });
});