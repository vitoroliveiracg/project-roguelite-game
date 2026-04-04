/** @file Ponto de entrada (entrypoint) da aplicação, responsável por instanciar as camadas principais (Domínio e Adapter), injetar as dependências e iniciar o ciclo de vida do jogo. */
import DomainFacade from "../../domain/DomainFacade";
import GameAdapter from "./components/GameAdapter";
import { EventHandler } from "../../domain/eventDispacher/eventDispacher";
import { logger } from "./shared/Logger";
import { CollisionAdapter } from "../../domain/ports/CollisionAdapter";
// Auto-carrega todos os arquivos de representação visual para disparar os Decorators de Registro
import.meta.glob('./components/gameObjectModule/**/*.ts', { eager: true });

/** Configuração inicial do jogo, contendo dados que o domínio precisa para criar seu estado inicial. A posição inicial do jogador foi movida para o centro para evitar problemas de câmera na borda do mapa. */
const gameConfig = {
  //? Deixei o level assim para ele ter uma vida legal e conseguir morrer
  player: { id: 1, level: 1, initialPos: { x: 512, y: 512 } }
};

/** Função principal (`main`) que orquestra a inicialização. O uso de `async` é necessário para aguardar o carregamento de assets (ex: imagens) antes que o jogo efetivamente comece a rodar. */
async function main() {
  const eventManager = new EventHandler();
  const collisionAdapter = new CollisionAdapter();
  
  const domain = new DomainFacade(gameConfig, logger, eventManager, collisionAdapter);
  const gameAdapter: GameAdapter = new GameAdapter(domain, eventManager);

  try {
    await gameAdapter.initialize();
  } catch (error) {
    console.error("Falha ao inicializar o jogo:", error);
  }
}

main();