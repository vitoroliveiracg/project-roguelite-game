import { describe, it, expect } from 'vitest';
import { PraxisValidator } from '../../../../../domain/ObjectModule/Entities/NPCs/PraxisValidator';

describe('PraxisValidator', () => {
  describe('Segurança (Sandbox)', () => {
    it('deve rejeitar código que contém tokens proibidos', () => {
      const maliciousCode = 'window.location.href = "http://evil.com";';
      const result = PraxisValidator.validateCode(maliciousCode);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('window');
    });

    it('deve rejeitar código que tenta usar eval', () => {
      const maliciousCode = 'eval("console.log(\'pwned\')")';
      const result = PraxisValidator.validateCode(maliciousCode);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('eval');
    });
  });

  describe('Validação de Sintaxe (Dry-Run)', () => {
    it('deve rejeitar código com erro de sintaxe', () => {
      const badCode = 'let x = {a: 1,'; // Chave não fechada
      const result = PraxisValidator.validateCode(badCode);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Erro Sintático do LLM');
    });

    it('deve aceitar código JavaScript sintaticamente válido', () => {
      const goodCode = `
        const dx = player.x - npc.x;
        npc.speed = dx > 10 ? 100 : 0;
      `;
      const result = PraxisValidator.validateCode(goodCode);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Bateria de Fuzzing (Injeção de Caos - Zero-Day Resilience)', () => {
    it('deve resistir a 50 payloads destrutivos comuns de LLMs sem quebrar o Event Loop (Throw)', () => {
      const malformedPayloads = [
        '```json\n{ "code": "player.hp = 0" }\n```',
        'while(true) { npc.move(); }',
        'Array.prototype.push = null;',
        'setTimeout(() => window.alert("hack"), 1000);',
        'fetch("http://evil.com").then(r => r.json())',
        'Object.keys(window).forEach(k => delete window[k])',
        'eval("1 + 1")',
        'const a = 1; \u0000 \uFFFF', // Unicode corrompido
        'let x = {', // Erro de sintaxe (Chave não fechada)
        'function() { return 1; }()()()', // Execução recursiva nula
      ];

      // Expande para 50 iterações com ruído para simular Fuzzing contínuo do LLM
      const fuzzingBattery = Array.from({ length: 50 }).map((_, i) => malformedPayloads[i % malformedPayloads.length] + `\n// Ruído mutacional ${i} - ${Math.random()}`);

      fuzzingBattery.forEach(payload => {
        expect(() => PraxisValidator.validateCode(payload)).not.toThrow();
      });
    });
  });
});