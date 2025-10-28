/** @file Contém uma função de inicialização para eventos de teclado globais, separada da lógica de input principal do GameAdapter. */

import type GameAdapter from "../GameAdapter";

/** Fase de Inicialização: Anexa um listener de evento `keydown` global ao documento para capturar ações de teclado discretas (não contínuas como movimento). @param gameAdapter A instância do `GameAdapter` que será notificada quando uma tecla específica for pressionada. */
export function initEvents(gameAdapter: GameAdapter) {
  document.addEventListener("keydown", event => {
    if (event.key === "a") {
      gameAdapter.keyPressed("a");
    }
  });
}