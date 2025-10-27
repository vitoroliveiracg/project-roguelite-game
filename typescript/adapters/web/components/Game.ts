let lastTime = 0;
let updateCallback: (deltaTime: number) => void = () => {};
let drawCallback: () => void = () => {};

export function initializeGame(
  updateFn: (deltaTime: number) => void,
  drawFn: () => void
) {
  updateCallback = updateFn;
  drawCallback = drawFn;
  lastTime = performance.now();
  window.requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime: number) {
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  updateCallback(deltaTime);
  drawCallback();

  
  window.requestAnimationFrame(gameLoop);
}
