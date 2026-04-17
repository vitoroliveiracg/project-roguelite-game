import { describe, it, expect } from 'vitest';
import VulnerableStatus from '../../../../../domain/ObjectModule/Entities/Status/VulnerableStatus';

describe('VulnerableStatus', () => {
  it('deve ser instanciado corretamente garantindo os identificadores base da Engine de Entidades', () => {
    const vulnerable = new VulnerableStatus(5);
    expect(vulnerable.id).toBe('vulnerable');
    expect(vulnerable.duration).toBe(5);
    expect(vulnerable.tickInterval).toBe(0.5);
  });
});