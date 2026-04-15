import { logger } from "../../shared/Logger";

import html from './playerStatus.html?raw';
import css from './playerStatus.css?raw';

/** @class PlayerStatusGui Controla a interface das barras de HP e Mana do jogador, aplicando alterações de tamanho via porcentagem calculada a partir dos dados do Domínio. */
export default class PlayerStatusGui {
    private hpBarFill!: HTMLElement;
    private hpBarTrail!: HTMLElement;
    private hpText!: HTMLElement;
    private manaBarFill!: HTMLElement;
    private manaBarTrail!: HTMLElement;
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
        this.hpBarTrail = document.getElementById('hp-bar-trail') as HTMLElement;
        this.hpText = document.getElementById('hp-text') as HTMLElement;
        this.manaBarFill = document.getElementById('mana-bar-fill') as HTMLElement;
        this.manaBarTrail = document.getElementById('mana-bar-trail') as HTMLElement;
        this.manaText = document.getElementById('mana-text') as HTMLElement;
        this.statusContainer = document.getElementById('status-effects-container') as HTMLElement;
    }

    public update(data: { hp?: number, maxHp?: number, mana?: number, maxMana?: number, activeStatuses?: { id: string, description: string, remaining: number }[] }): void {
        if (data.hp === undefined || data.maxHp === undefined || data.mana === undefined || data.maxMana === undefined) return;

        const hpPercentage = data.maxHp > 0 ? Math.max(0, Math.min(100, (data.hp / data.maxHp) * 100)) : 0;
        const manaPercentage = data.maxMana > 0 ? Math.max(0, Math.min(100, (data.mana / data.maxMana) * 100)) : 0;

        let isPoisoned = false;
        let isBurning = false;
        // Reação Visual da Barra de HP aos Status Elementais
        if (data.activeStatuses) {
            isPoisoned = data.activeStatuses.some(s => s.id === 'poison');
            isBurning = data.activeStatuses.some(s => s.id === 'burn');
            
            this.hpBarFill.className = 'status-bar-fill hp-fill'; // Reseta as classes base
            if (isPoisoned) this.hpBarFill.classList.add('poisoned');
            else if (isBurning) this.hpBarFill.classList.add('burning');
        }

        if (hpPercentage !== this.lastHpPercentage) {
            if (this.lastHpPercentage !== -1) {
                const isDamage = hpPercentage < this.lastHpPercentage;
                const diff = Math.abs(hpPercentage - this.lastHpPercentage);
                
                // Otimização de CPU: Só aplica as transições caras se for um chunk de dano (> 1%).
                // Se for dano/cura contínua (ex: Veneno) a cada frame, desliga a transição.
                if (diff > 1.0) {
                    if (isDamage) {
                        this.hpBarFill.style.transition = 'width 0.1s ease-out';
                        this.hpBarTrail.style.transition = 'width 0.4s ease-out 0.15s';
                    } else {
                        this.hpBarFill.style.transition = 'width 0.3s ease-out';
                        this.hpBarTrail.style.transition = 'none';
                    }
                } else {
                    this.hpBarFill.style.transition = 'none';
                    this.hpBarTrail.style.transition = 'none';
                }
            }
            this.hpBarFill.style.width = `${hpPercentage}%`;
            this.hpBarTrail.style.width = `${hpPercentage}%`;
            this.lastHpPercentage = hpPercentage;
        }
        if (manaPercentage !== this.lastManaPercentage) {
            if (this.lastManaPercentage !== -1) {
                const isDamage = manaPercentage < this.lastManaPercentage;
                const diff = Math.abs(manaPercentage - this.lastManaPercentage);
                if (diff > 1.0) {
                    this.manaBarFill.style.transition = isDamage ? 'width 0.1s ease-out' : 'width 0.3s ease-out';
                    this.manaBarTrail.style.transition = isDamage ? 'width 0.4s ease-out 0.15s' : 'none';
                } else {
                    this.manaBarFill.style.transition = 'none';
                    this.manaBarTrail.style.transition = 'none';
                }
            }
            this.manaBarFill.style.width = `${manaPercentage}%`;
            this.manaBarTrail.style.width = `${manaPercentage}%`;
            this.lastManaPercentage = manaPercentage;
        }

        const hpStr = `${Math.ceil(data.hp)}/${data.maxHp}`;
        if (hpStr !== this.lastHpText) { this.hpText.textContent = hpStr; this.lastHpText = hpStr; }

        const manaStr = `${Math.ceil(data.mana)}/${data.maxMana}`;
        if (manaStr !== this.lastManaText) { this.manaText.textContent = manaStr; this.lastManaText = manaStr; }

        if (this.statusContainer && data.activeStatuses) {
            // Otimização Zero-GC: Evita criar novos Sets e Arrays a cada frame
            const children = this.statusContainer.children;
            for (let i = children.length - 1; i >= 0; i--) {
                const child = children[i] as HTMLElement;
                if (!child) continue;
                const statusId = child.id.replace('status-', '');
                let exists = false;
                for (let j = 0; j < data.activeStatuses.length; j++) {
                    if (data.activeStatuses[j]?.id === statusId) { exists = true; break; }
                }
                if (!exists) child.remove();
            }

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
                
                // Otimização: Só interage com o DOM se o texto (arredondado) mudar de fato
                const tooltipText = `${status.id.toUpperCase()} - ${Math.ceil(status.remaining)}s\n${status.description}`;
                if (div.getAttribute('data-tooltip') !== tooltipText) {
                    div.setAttribute('data-tooltip', tooltipText);
                }
            });
        }
    }
}