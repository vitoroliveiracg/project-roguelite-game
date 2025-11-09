/** * @file Abstrai o `requestAnimationFrame` do navegador para criar um game loop clássico, separando a lógica de `update` e `draw` e calculando o `deltaTime`. */
import { logger } from "../shared/Logger"; 

let lastTime = 0; /** @private Armazena o timestamp do último frame para calcular o `deltaTime`. */
let updateCallback: ((deltaTime: number) => void) = () => {}; /** @private O callback para a função de atualização da lógica do jogo. */
let drawCallback: (() => Promise<void>) = async () => {}; /** @private O callback para a função de desenho do estado do jogo. */

/** Configura e inicia o game loop. @param updateFn A função que atualiza a lógica do jogo, chamada primeiro em cada frame. @param drawFn A função que desenha o estado do jogo na tela, chamada após `updateFn`. */
export function initializeGame(
  updateFn: (deltaTime: number) => void,
  drawFn: () => Promise<void>
) {
  updateCallback = updateFn;
  drawCallback = drawFn;
  lastTime = performance.now();
  window.requestAnimationFrame(gameLoop);
}

/** A função interna que é executada a cada frame pelo navegador. Calcula o deltaTime e chama os callbacks de update e draw. @private @param currentTime O timestamp atual fornecido pelo navegador. */
async function gameLoop(currentTime: number) {
  // debugger; // Descomente esta linha para pausar a execução a cada frame e inspecionar o estado.
  const deltaTime = (currentTime - lastTime) / 1000; // Calcula o tempo decorrido desde o último frame em segundos.
  lastTime = currentTime; // Atualiza o timestamp do último frame.
  logger.log('loop', `New frame. DeltaTime: ${deltaTime.toFixed(4)}`);
  updateCallback(deltaTime); // Chama a função de atualização da lógica do jogo.
  await drawCallback(); // Chama a função de desenho do estado do jogo.
  window.requestAnimationFrame(gameLoop); // Solicita o próximo frame de animação.
}
