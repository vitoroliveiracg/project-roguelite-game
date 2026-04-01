import { logger } from "../../shared/Logger";
import html from './characterMenu.html?raw';
import css from './characterMenu.css?raw';
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import gunDesignUrl from '../../assets/itens/gun-design-1.png';

/** @class CharacterMenuGui Controla a interface principal do personagem com abas (Inv, Status, Skill). */
export default class CharacterMenuGui {
    private container!: HTMLElement;
    private isVisible: boolean = false;

    private strEl!: HTMLElement; private dexEl!: HTMLElement;
    private intEl!: HTMLElement; private conEl!: HTMLElement;
    private wisEl!: HTMLElement; private chaEl!: HTMLElement;

    private tabs: { [key: string]: { btn: HTMLElement, content: HTMLElement } } = {};
    private currentTab: string = 'status';

    private togglePauseCallback: () => void;
    private bpSlots!: NodeListOf<HTMLElement>;
    private eqMain!: HTMLElement;
    private pointsEl!: HTMLElement;
    private addBtns!: NodeListOf<HTMLButtonElement>;

    constructor(
        togglePauseCallback: () => void, 
        private equipItemCallback: (index: number) => void,
        private unequipItemCallback: (slot: string) => void,
        private allocateAttributeCallback: (attribute: string) => void
    ) {
        this.togglePauseCallback = togglePauseCallback;
        this.injectUI();
        this.setupElements();
        this.setupTabs();
        this.hide();
        logger.log('init', 'CharacterMenuGui instantiated and UI injected.');
    }

    private injectUI(): void {
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
        const div = document.createElement('div'); div.innerHTML = html;
        this.container = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.container);
    }

    private setupElements(): void {
        this.strEl = document.getElementById('attr-str') as HTMLElement; this.dexEl = document.getElementById('attr-dex') as HTMLElement;
        this.intEl = document.getElementById('attr-int') as HTMLElement; this.conEl = document.getElementById('attr-con') as HTMLElement;
        this.wisEl = document.getElementById('attr-wis') as HTMLElement; this.chaEl = document.getElementById('attr-cha') as HTMLElement;
        this.pointsEl = document.getElementById('attr-points') as HTMLElement;

        this.addBtns = this.container.querySelectorAll('.attr-add-btn') as NodeListOf<HTMLButtonElement>;

        this.bpSlots = this.container.querySelectorAll('.bp-slot') as NodeListOf<HTMLElement>;
        this.eqMain = this.container.querySelector('.eq-main') as HTMLElement;

        this.bpSlots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.equipItemCallback(index);
            });
        });

        this.eqMain.addEventListener('click', () => {
            this.unequipItemCallback('mainHand');
        });

        this.addBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const attr = btn.getAttribute('data-attr');
                if (attr) this.allocateAttributeCallback(attr);
            });
        });

        this.tabs = {
            'inv': { btn: document.getElementById('tab-btn-inv')!, content: document.getElementById('tab-content-inv')! },
            'status': { btn: document.getElementById('tab-btn-status')!, content: document.getElementById('tab-content-status')! },
            'skill': { btn: document.getElementById('tab-btn-skill')!, content: document.getElementById('tab-content-skill')! }
        };
    }

    private setupTabs(): void {
        for (const [key, tab] of Object.entries(this.tabs)) {
            tab.btn.addEventListener('click', () => this.switchTab(key));
        }
    }

    private switchTab(tabKey: string): void {
        for (const [key, tab] of Object.entries(this.tabs)) {
            if (key === tabKey) {
                tab.btn.classList.add('active');
                tab.content.style.display = 'flex';
            } else {
                tab.btn.classList.remove('active');
                tab.content.style.display = 'none';
            }
        }
        this.currentTab = tabKey;
    }

    public get isOpen(): boolean { return this.isVisible; }

    public toggle(): void {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'flex' : 'none';
        this.togglePauseCallback();
    }

    public hide(): void { if (this.isVisible) { this.isVisible = false; this.container.style.display = 'none'; this.togglePauseCallback(); } }

    public update(data: EntityRenderableState): void {
        if (!this.isVisible || !data.attributes) return;
        const attrs = data.attributes;
        this.strEl.textContent = attrs.strength.toString(); this.dexEl.textContent = attrs.dexterity.toString();
        this.intEl.textContent = attrs.inteligence.toString(); this.conEl.textContent = attrs.constitution.toString();
        this.wisEl.textContent = attrs.wisdown.toString(); this.chaEl.textContent = attrs.charisma.toString();
        this.pointsEl.textContent = attrs.availablePoints.toString();

        this.addBtns.forEach(btn => {
            btn.disabled = attrs.availablePoints <= 0;
        });
        
        if (data.backpack) {
            this.bpSlots.forEach((slot, index) => {
                const item = data.backpack![index];
                if (item) {
                    if (item.iconId === 1) slot.textContent = '🪄';
                    else if (item.iconId === 2) slot.innerHTML = `<img src="${gunDesignUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">`;
                    else slot.textContent = '📦';
                    
                    slot.title = item.name;
                    slot.style.borderColor = '#FFD700';
                } else { slot.innerHTML = ''; slot.textContent = ''; slot.title = ''; slot.style.borderColor = '#444'; }
            });
        }
        if (data.equipment) {
            if (data.equipment.mainHand) {
                if (data.equipment.mainHand.iconId === 1) this.eqMain.textContent = '🪄';
                else if (data.equipment.mainHand.iconId === 2) this.eqMain.innerHTML = `<img src="${gunDesignUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">`;
                else this.eqMain.textContent = '⚔️';
                this.eqMain.title = data.equipment.mainHand.name;
                this.eqMain.style.borderColor = '#FFD700';
            } else {
                this.eqMain.innerHTML = '';
                this.eqMain.textContent = '⚔️';
                this.eqMain.title = 'Mão Principal';
                this.eqMain.style.borderColor = '#555';
            }
        }
    }
}