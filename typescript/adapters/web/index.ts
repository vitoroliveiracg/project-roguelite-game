import GameAdapter from "./components/GameAdapter";
import { initEvents } from "./components/KeyboardModule/keyboardHandler";



const gameAdapter :GameAdapter = new GameAdapter();
gameAdapter.initialize();

initEvents(gameAdapter);