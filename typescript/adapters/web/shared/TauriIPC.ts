import { invoke } from '@tauri-apps/api/core';
import { logger } from './Logger';

/**
 * Métrica 17: Wrapper de Monitoramento de IPC (Inter-Process Communication).
 * Intercepta todas as chamadas do Adaptador para o Rust (Tauri) e valida se o tempo 
 * de I/O ultrapassa o orçamento de 1 frame (16.6ms), evitando que o Game Loop engasgue.
 */
export async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    const start = performance.now();
    
    try {
        const result = await invoke<T>(command, args);
        const end = performance.now();
        const latency = end - start;

        if (latency > 16.6) {
            logger.log('warning' as any, `[IPC Bottleneck] Chamada Tauri '${command}' consumiu ${latency.toFixed(2)}ms. Risco crítico de Stuttering!`);
        } else {
            logger.log('ipc' as any, `[Tauri] Chamada '${command}' resolvida em ${latency.toFixed(2)}ms.`);
        }

        return result;
    } catch (error) {
        logger.log('error', `[Tauri IPC Error] Falha no comando nativo '${command}':`, error);
        throw error;
    }
}