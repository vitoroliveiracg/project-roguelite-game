/**
 * Validador Estrito ("Mini Praxis") para o código gerado pelo Ollama.
 * Garante a integridade do Game Loop (Erros de Sintaxe) e a Segurança do PC do Jogador (Sandbox).
 */
export class PraxisValidator {
    // Lista de palavras-chave estritamente proibidas para a IA usar
    private static forbiddenTokens = [
        'window', 'document', 'eval', 'setTimeout', 'setInterval',
        'fetch', 'XMLHttpRequest', 'WebSocket', 'globalThis', 
        'process', 'require', 'import', 'localStorage', 'sessionStorage',
        'indexedDB', 'caches', '__proto__', 'constructor', 'prototype',
        'debugger', 'alert'
    ];

    public static validateCode(code: string): { isValid: boolean, reason?: string } {
        // 1. Verificação de Segurança (Sandbox Level 1)
        for (const token of this.forbiddenTokens) {
            // Expressão regular para encontrar a palavra exata (evita falsos positivos como "documento")
            const regex = new RegExp(`\\b${token}\\b`);
            if (regex.test(code)) {
                return { isValid: false, reason: `Token de segurança violado: '${token}'` };
            }
        }

        // 2. Verificação de Sintaxe (Dry-Run Compilation)
        try {
            // Tenta compilar. Se houver erro de digitação da IA, o JS lança SyntaxError instantâneo
            new Function("npc", "player", "deltaTime", "Math", code);
        } catch (error: any) {
            return { isValid: false, reason: `Erro Sintático do LLM: ${error.message}` };
        }

        return { isValid: true };
    }
}