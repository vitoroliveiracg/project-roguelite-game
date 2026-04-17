import { logger } from './Logger';

export async function checkOllamaHealth(): Promise<void> {
    logger.log('init' as any, 'Verificando status do daemon local do Ollama na porta 11434...');
    try {
        const start = performance.now();
        const response = await fetch('http://127.0.0.1:11434/api/tags', { method: 'GET' });
        const end = performance.now();
        
        if (response.ok) {
            const data = await response.json();
            logger.log('init' as any, `[Ollama Health] Online e respondendo em ${(end - start).toFixed(2)}ms. Modelos instalados: ${data.models?.length || 0}`);
        } else {
            logger.log('warning' as any, `[Ollama Health] O servidor respondeu, mas com status de erro: ${response.status}`);
        }
    } catch (error) {
        logger.log('error' as any, '[Ollama Health] Offline ou inacessível. O Sidecar do Rust falhou ao iniciar ou a porta 11434 está bloqueada.', error);
    }
}