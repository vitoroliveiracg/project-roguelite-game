import { logger } from "../../shared/Logger";

import html from './playerStatus.html?raw';
import css from './playerStatus.css?raw';

/** @class PlayerStatusGui Controla a interface das barras de HP e Mana do jogador, aplicando alterações de tamanho via porcentagem calculada a partir dos dados do Domínio. */
export default class PlayerStatusGui {
    private hpBarFill!: HTMLElement;
    private hpText!: HTMLElement;
    private manaBarFill!: HTMLElement;
    private manaText!: HTMLElement;
    private statusContainer!: HTMLElement;

    private lastHpPercentage: number = -1;
    private lastManaPercentage: number = -1;
    private lastHpText: string = "";
    private lastManaText: string = "";

    constructor() {
        this.injectUI();
        this.setupElements();
        logger.log('init', 'PlayerStatusGui instantiated and UI injected.');
    }

    private injectUI(): void {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container.firstChild!);
    }

    private setupElements(): void {
        this.hpBarFill = document.getElementById('hp-bar-fill') as HTMLElement;
        this.hpText = document.getElementById('hp-text') as HTMLElement;
        this.manaBarFill = document.getElementById('mana-bar-fill') as HTMLElement;
        this.manaText = document.getElementById('mana-text') as HTMLElement;
        this.statusContainer = document.getElementById('status-effects-container') as HTMLElement;
    }

    public update(data: { hp?: number, maxHp?: number, mana?: number, maxMana?: number, activeStatuses?: { id: string, description: string, remaining: number }[] }): void {
        if (data.hp === undefined || data.maxHp === undefined || data.mana === undefined || data.maxMana === undefined) return;

        const hpPercentage = data.maxHp > 0 ? Math.max(0, Math.min(100, (data.hp / data.maxHp) * 100)) : 0;
        const manaPercentage = data.maxMana > 0 ? Math.max(0, Math.min(100, (data.mana / data.maxMana) * 100)) : 0;

        if (hpPercentage !== this.lastHpPercentage) {
            this.hpBarFill.style.width = `${hpPercentage}%`;
            this.lastHpPercentage = hpPercentage;
        }
        if (manaPercentage !== this.lastManaPercentage) {
            this.manaBarFill.style.width = `${manaPercentage}%`;
            this.lastManaPercentage = manaPercentage;
        }

        // Reação Visual da Barra de HP aos Status Elementais
        if (data.activeStatuses) {
            const isPoisoned = data.activeStatuses.some(s => s.id === 'poison');
            const isBurning = data.activeStatuses.some(s => s.id === 'burn');
            
            this.hpBarFill.className = 'status-bar-fill hp-fill'; // Reseta as classes base
            if (isPoisoned) this.hpBarFill.classList.add('poisoned');
            else if (isBurning) this.hpBarFill.classList.add('burning');
        }

        const hpStr = `${Math.ceil(data.hp)}/${data.maxHp}`;
        if (hpStr !== this.lastHpText) { this.hpText.textContent = hpStr; this.lastHpText = hpStr; }

        const manaStr = `${Math.ceil(data.mana)}/${data.maxMana}`;
        if (manaStr !== this.lastManaText) { this.manaText.textContent = manaStr; this.lastManaText = manaStr; }

        if (this.statusContainer && data.activeStatuses) {
            const currentStatusIds = new Set(data.activeStatuses.map(s => s.id));
            
            // Remove os ícones de status que já expiraram
            Array.from(this.statusContainer.children).forEach(child => {
                if (!currentStatusIds.has(child.id.replace('status-', ''))) {
                    child.remove();
                }
            });

            data.activeStatuses.forEach(status => {
                let div = document.getElementById(`status-${status.id}`) as HTMLElement;
                
                if (!div) {
                    div = document.createElement('div');
                    div.id = `status-${status.id}`;
                    div.className = 'status-icon';
                    div.style.width = '24px';
                    div.style.height = '24px';
                    div.style.borderRadius = '4px';
                    div.style.border = '1px solid rgba(255,255,255,0.4)';
                    div.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
                    div.style.cursor = 'help';
                    
                    if (status.id === 'burn') div.style.background = 'linear-gradient(135deg, #ff4e00, #ec9f05)';
                    else if (status.id === 'poison') div.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
                    else if (status.id === 'wet') div.style.background = 'linear-gradient(135deg, #00c6ff, #0072ff)';
                    else if (status.id === 'paralyze') div.style.background = 'linear-gradient(135deg, #f2c94c, #f2f2f2)';
                    else if (status.id === 'stun') div.style.background = 'linear-gradient(135deg, #8E2DE2, #4A00E0)';
                    else div.style.backgroundColor = 'gray';
                    
                    this.statusContainer.appendChild(div);
                }
                
                // Atualiza o tempo restante dinamicamente no atributo de dados (lido pelo CSS)
                div.setAttribute('data-tooltip', `${status.id.toUpperCase()} - ${status.remaining.toFixed(1)}s\n${status.description}`);
            });
        }
    }
}