import { describe, it, expect, beforeEach } from 'vitest';
import { BindAction, ClassActionBindings } from '../../../domain/eventDispacher/ActionBindings';
import type { action } from '../../../domain/eventDispacher/actions.type';

describe('ActionBindings Decorator', () => {
  beforeEach(() => {
    ClassActionBindings.clear();
  });

  it('deve registrar um método em ClassActionBindings sob o nome da classe', () => {
    class DummyPlayer {
      @BindAction('up' as action)
      moveUp() {}
    }

    const bindings = ClassActionBindings.get('DummyPlayer');
    expect(bindings).toBeDefined();
    expect(bindings?.get('up' as action)).toBe('moveUp');
  });

  it('deve lançar erro (Fail-Fast) se a mesma ação for vinculada mais de uma vez na mesma classe', () => {
    expect(() => {
      class BadPlayer {
        @BindAction('down' as action)
        moveDown() {}

        @BindAction('down' as action)
        moveDownTwo() {}
      }
    }).toThrow(/Conflito de Bind/);
  });
});
