import { logger } from "../../shared/Logger";
import html from './windowHud.html?raw';
import css from './windowHud.css?raw';
import { getCurrentWindow } from '@tauri-apps/api/window';

export default class WindowHudGui {
    private container!: HTMLElement;

    constructor() {
        // Só injeta a barra superior se o jogo estiver rodando pelo binário do Tauri!
        if ((window as any).__TAURI_INTERNALS__) {
            this.injectUI();
            this.setupActions();
            logger.log('init', 'WindowHudGui instantiated and UI injected.');
        } else {
            logger.log('init', 'WindowHudGui skipped (Not running in Tauri).');
        }
    }

    private injectUI(): void {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const div = document.createElement('div');
        div.innerHTML = html;
        this.container = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.container);

        const appIcon = this.container.querySelector('#titlebar-app-icon') as HTMLImageElement;
        const fullscreenBtn = this.container.querySelector('#titlebar-fullscreen') as HTMLButtonElement;
        const minimizeBtn = this.container.querySelector('#titlebar-minimize') as HTMLButtonElement;
        const maximizeBtn = this.container.querySelector('#titlebar-maximize') as HTMLButtonElement;
        const closeBtn = this.container.querySelector('#titlebar-close') as HTMLButtonElement;

        if (fullscreenBtn) fullscreenBtn.innerHTML = `<img src="${new URL('../../assets/icons/fullscreen-button.png', import.meta.url).href}">`;
        if (minimizeBtn) minimizeBtn.innerHTML = `<img src="${new URL('../../assets/icons/minimize-button.png', import.meta.url).href}">`;
        if (maximizeBtn) maximizeBtn.innerHTML = `<img src="${new URL('../../assets/icons/maximize-button.png', import.meta.url).href}">`;
        if (closeBtn) closeBtn.innerHTML = `<img src="${new URL('../../assets/icons/close.png', import.meta.url).href}">`;
        if (appIcon) appIcon.src = new URL('../../../../../src-tauri/icons/game-icon.png', import.meta.url).href;
    }

    private setupActions(): void {
        const fullscreenBtn = this.container.querySelector('#titlebar-fullscreen') as HTMLButtonElement;
        const minimizeBtn = this.container.querySelector('#titlebar-minimize') as HTMLButtonElement;
        const maximizeBtn = this.container.querySelector('#titlebar-maximize') as HTMLButtonElement;
        const closeBtn = this.container.querySelector('#titlebar-close') as HTMLButtonElement;

        fullscreenBtn.addEventListener('click', async () => {
            try {
                const win = getCurrentWindow();
                const isFullscreen = await win.isFullscreen();
                await win.setFullscreen(!isFullscreen);
            } catch(e) { console.warn(e); }
        });

        minimizeBtn.addEventListener('click', async () => {
            try {
                await getCurrentWindow().minimize();
            } catch(e) { console.warn(e); }
        });

        maximizeBtn.addEventListener('click', async () => {
            try {
                // toggleMaximize alterna automaticamente entre Maximizado e Restaurado
                await getCurrentWindow().toggleMaximize();
            } catch(e) { console.warn(e); }
        });

        closeBtn.addEventListener('click', async () => {
            try {
                await getCurrentWindow().close();
            } catch(e) { console.warn(e); }
        });
    }
}