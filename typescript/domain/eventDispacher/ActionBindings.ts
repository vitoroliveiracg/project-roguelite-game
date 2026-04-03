import type { action } from "./actions.type";

// Mapeamento global de "Qual classe escuta qual ação" a nível de Prototype
export const ClassActionBindings = new Map<any, Map<action, string>>();

/**
 * Decorator que vincula automaticamente a execução de um método a uma ação do jogo.
 * @param actionName O nome da ação (ex: 'up', 'castSpell', 'spell_0')
 */
export function BindAction(actionName: action) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const constructor = target.constructor;
        if (!ClassActionBindings.has(constructor)) {
            ClassActionBindings.set(constructor, new Map());
        }
        const bindings = ClassActionBindings.get(constructor)!;
        if (bindings.has(actionName)) {
            throw new Error(`Conflito de Bind: A classe ${constructor.name} já registrou a ação '${actionName}' em outro método.`);
        }
        bindings.set(actionName, propertyKey);
    };
}