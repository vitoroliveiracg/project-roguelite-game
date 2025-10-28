/** @file Implementa um Logger centralizado com canais para depuração granular. */
//? Como Usar: GameLogger está disponível globalmente. Ex: `GameLogger.enable('loop')` para ligar um canal, ou `GameLogger.enableTrace('sync')` para ligar com stack trace.

/** Define os canais de log disponíveis na aplicação. Isso ajuda a manter a consistência e oferece autocompletar. */
export type LogChannel = 
  | 'init'      // Para o fluxo de inicialização
  | 'input'     // Para inputs do usuário (teclado, mouse)
  | 'domain'    // Para eventos dentro da camada de domínio
  | 'sync'      // Para a sincronização entre domínio e renderizáveis
  | 'render'    // Para o ciclo de desenho
  | 'camera'    // Para lógica da câmera
  | 'loop'      // Para o game loop principal (deltaTime)
  | 'factory'   // Para a criação de objetos na RenderableFactory
  | 'error';    // Para erros e avisos importantes

/**
 * @class Logger
 * Gerencia a exibição de logs com base em canais ativos.
 * Permite ativar/desativar a visualização de logs específicos em tempo de execução.
 */
class Logger {
  /** @private Um Set contendo os canais de log que estão atualmente ativos. */
  private activeChannels: Set<LogChannel> = new Set(['init', 'error']); // Ativa 'init' e 'error' por padrão.
  /** @private Um Set contendo os canais que devem exibir um stack trace completo. */
  private traceEnabledChannels: Set<LogChannel> = new Set();

  /** Registra uma mensagem de log se o seu canal estiver ativo. @param channel O canal ao qual a mensagem pertence. @param message A mensagem a ser exibida. @param data Dados adicionais para serem logados. */
  public log(channel: LogChannel, message: string, ...data: any[]): void {
    if (this.activeChannels.has(channel)) {
      const logMessage = `[${channel.toUpperCase()}] ${message}`;
      this.traceEnabledChannels.has(channel) ? console.trace(logMessage, ...data) : console.log(logMessage, ...data);
    }
  }

  /** Ativa um ou mais canais de log. @param channels Os canais a serem ativados. */
  public enable(...channels: LogChannel[]): void {
    channels.forEach(c => this.activeChannels.add(c));
    console.log(`[Logger] Enabled channels: ${channels.join(', ')}. Active: [${Array.from(this.activeChannels).join(', ')}]`);
  }

  /** Desativa um ou mais canais de log. @param channels Os canais a serem desativados. */
  public disable(...channels: LogChannel[]): void {
    channels.forEach(c => this.activeChannels.delete(c));
    console.log(`[Logger] Disabled channels: ${channels.join(', ')}. Active: [${Array.from(this.activeChannels).join(', ')}]`);
  }

  //? ----------- Tracing -----------

  /** Ativa o modo de stack trace para um ou mais canais. Eles também serão ativados se já não estiverem. @param channels Os canais para os quais o trace será ativado. */
  public enableTrace(...channels: LogChannel[]): void {
    this.enable(...channels); // Garante que o canal esteja ativo
    channels.forEach(c => this.traceEnabledChannels.add(c));
    console.log(`[Logger] Enabled TRACE for channels: ${channels.join(', ')}. Active traces: [${Array.from(this.traceEnabledChannels).join(', ')}]`);
  }

  /** Desativa o modo de stack trace para um ou mais canais. @param channels Os canais para os quais o trace será desativado. */
  public disableTrace(...channels: LogChannel[]): void {
    channels.forEach(c => this.traceEnabledChannels.delete(c));
    console.log(`[Logger] Disabled TRACE for channels: ${channels.join(', ')}. Active traces: [${Array.from(this.traceEnabledChannels).join(', ')}]`);
  }

}

export const logger = new Logger();
(window as any).GameLogger = logger;