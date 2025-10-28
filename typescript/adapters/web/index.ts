import DomainFacade from "../../domain/DomainFacade";
import GameAdapter from "./components/GameAdapter";
import { initEvents } from "./components/keyboardModule/keyboardHandler";

const gameConfig = {
  //! Debug
  // Corrigido: A posição inicial estava na borda exata do mapa (1024x1024),
  // fazendo a câmera travar no canto. Movido para uma posição mais central.
  player: { id: 1, level: 1, initialPos: { x: 512, y: 512 } }
};

const domain = new DomainFacade(gameConfig);

const gameAdapter: GameAdapter = new GameAdapter(domain);

async function main() {

  try {

    await gameAdapter.initialize();
    initEvents(gameAdapter);

  } catch (error) {
    console.error("Falha fatal ao inicializar o jogo:", error);
  }

}

main();