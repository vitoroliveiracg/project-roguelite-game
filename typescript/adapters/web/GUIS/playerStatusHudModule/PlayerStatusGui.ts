import { logger } from "../../shared/Logger";

import html from './playerStatus.html?raw';
import css from './playerStatus.css?raw';

/** @class PlayerStatusGui Controla a interface das barras de HP e Mana do jogador, aplicando alterações de tamanho via porcentagem calculada a partir dos dados do Domínio. */
export default class PlayerStatusGui {
    private hpBarFill!: HTMLElement;
    private hpText!: HTMLElement;
    private manaBarFill!: HTMLElement;
    private manaText!: HTMLElement;

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
    }

    public update(data: { hp?: number, maxHp?: number, mana?: number, maxMana?: number }): void {
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

        const hpStr = `${Math.ceil(data.hp)}/${data.maxHp}`;
        if (hpStr !== this.lastHpText) { this.hpText.textContent = hpStr; this.lastHpText = hpStr; }

        const manaStr = `${Math.ceil(data.mana)}/${data.maxMana}`;
        if (manaStr !== this.lastManaText) { this.manaText.textContent = manaStr; this.lastManaText = manaStr; }
    }
}