import { logger } from "../../shared/Logger";
import html from './gameOver.html?raw';
import css from './gameOver.css?raw';

export default class GameOverGui {
    private container!: HTMLElement;

    constructor(private restartCallback: () => void) {
        this.injectUI();
        this.hide();
        logger.log('init', 'GameOverGui instantiated and UI injected.');
    }

    private injectUI(): void {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const div = document.createElement('div');
        div.innerHTML = html;
        this.container = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.container);

        const restartBtn = this.container.querySelector('#restart-btn') as HTMLButtonElement;
        restartBtn.addEventListener('click', () => {
            this.restartCallback();
        });
    }

    public show(): void {
        this.container.style.display = 'flex';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }
}