import { describe, it, expect, vi } from 'vitest';
import { HitboxParser, type HitboxJSON } from '../../../domain/hitBox/HitboxParser';
import { HitBoxCircle } from '../../../domain/hitBox/HitBoxCircle';
import HitBoxPolygon from '../../../domain/hitBox/HitBoxPolygon';

describe('HitboxParser', () => {
  const mockCallback = vi.fn();
  const pivot = { x: 0, y: 0 };

  describe('Segurança de Dados (Fail-Fast)', () => {
    it('deve lançar erro ao receber DTO do tipo Circle sem a propriedade radius', () => {
      const badJson: HitboxJSON[] = [{ id: '1', type: 'circle', coordinates: { x: 0, y: 0 }, rotation: 0 }];
      expect(() => HitboxParser.parse(badJson, pivot, mockCallback)).toThrow('Invalid hitbox data or unsupported type');
    });

    it('deve lançar erro ao receber DTO do tipo Polygon sem o array points', () => {
      const badJson: HitboxJSON[] = [{ id: '1', type: 'polygon', coordinates: { x: 0, y: 0 }, rotation: 0 }];
      expect(() => HitboxParser.parse(badJson, pivot, mockCallback)).toThrow('Invalid hitbox data or unsupported type');
    });

    it('deve lançar erro ao receber tipo não mapeado', () => {
      const badJson = [{ id: '1', type: 'triangle', coordinates: { x: 0, y: 0 }, rotation: 0 }] as unknown as HitboxJSON[];
      expect(() => HitboxParser.parse(badJson, pivot, mockCallback)).toThrow('Invalid hitbox data or unsupported type');
    });
  });

  describe('Parsing Válido', () => {
    it('deve instanciar HitBoxCircle adequadamente', () => {
      const validJson: HitboxJSON[] = [{ id: '1', type: 'circle', coordinates: { x: 10, y: 10 }, rotation: 0, radius: 5 }];
      const hitboxes = HitboxParser.parse(validJson, pivot, mockCallback);
      
      expect(hitboxes[0]).toBeInstanceOf(HitBoxCircle);
      expect((hitboxes[0] as HitBoxCircle).radius).toBe(5);
    });

    it('deve instanciar HitBoxPolygon adequadamente', () => {
      const validJson: HitboxJSON[] = [{ id: '2', type: 'polygon', coordinates: { x: 0, y: 0 }, rotation: 0, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }];
      const hitboxes = HitboxParser.parse(validJson, pivot, mockCallback);
      
      expect(hitboxes[0]).toBeInstanceOf(HitBoxPolygon);
    });
  });
});