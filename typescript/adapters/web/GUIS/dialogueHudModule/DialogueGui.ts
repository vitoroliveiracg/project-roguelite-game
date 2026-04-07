import { logger } from "../../shared/Logger";
import html from './dialogue.html?raw';
import css from './dialogue.css?raw';

export default class DialogueGui {
    private container!: HTMLElement;
    private nameEl!: HTMLElement;
    private textEl!: HTMLElement;
    private inputEl!: HTMLInputElement;
    private isVisible: boolean = false;
    private typingInterval: number | null = null;
    private currentNpcId: number | undefined;

    constructor(
        private onPlayerReply: (message: string, npcId?: number) => void,
        private onTogglePause: () => void
    ) {
        this.injectUI();
        this.setupInput();
        logger.log('init', 'DialogueGui instantiated.');
    }

    private injectUI(): void {
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
        const div = document.createElement('div'); div.innerHTML = html;
        this.container = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.container);
        
        this.nameEl = this.container.querySelector('#dialogue-name') as HTMLElement;
        this.textEl = this.container.querySelector('#dialogue-text') as HTMLElement;
        this.inputEl = this.container.querySelector('#dialogue-input') as HTMLInputElement;
    }

    public get isOpen(): boolean { return this.isVisible; }

    private setupInput(): void {
        this.inputEl.addEventListener('keydown', (e) => {
            // Impede que o personagem se mova enquanto digita (evita vazar atalhos de input para o InputManager)
            e.stopPropagation(); 
            
            if (e.key === 'Enter') {
                const msg = this.inputEl.value.trim();
                if (msg) {
                    this.onPlayerReply(msg, this.currentNpcId);
                    this.inputEl.value = '';
                    this.inputEl.disabled = true; // Trava até a IA responder
                    this.textEl.innerHTML = '<span style="color: #666;">(Aguardando resposta do Mestre...)</span>';
                }
            }
        });

        // Listener global para garantir que o Escape feche mesmo sem foco no input
        window.addEventListener('keydown', (e) => {
            if (this.isVisible && e.key === 'Escape') {
                this.hide();
            }
        });

        // Botão de fechar (X)
        const closeBtn = this.container.querySelector('#dialogue-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
    }

    public show(npcName: string, text: string, npcId?: number): void {
        this.currentNpcId = npcId;
        this.nameEl.textContent = npcName;
        
        if (!this.isVisible) {
            this.isVisible = true;
            this.container.style.display = 'flex';
            this.onTogglePause(); // Pausa o jogo no fundo
        }
        
        if (text === "...") {
            this.inputEl.disabled = true;
            this.textEl.innerHTML = '<span style="color: #888; font-style: italic;">(Aguardando resposta...)</span>';
        } else {
            this.inputEl.disabled = false;
            this.textEl.textContent = text;
            this.inputEl.focus();
        }
    }

    public hide(): void {
        if (this.isVisible) {
            this.isVisible = false;
            this.container.style.display = 'none';
            this.onTogglePause(); // Retoma o jogo
        }
    }
}