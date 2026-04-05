import { logger } from "../../shared/Logger";
import html from './characterMenu.html?raw';
import css from './characterMenu.css?raw';
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import { VisualConfigMap, type ItemVisualConfig } from "../../shared/GlobalVisualRegistry";

/** @class CharacterMenuGui Controla a interface principal do personagem com abas (Inv, Status, Skill). */
export default class CharacterMenuGui {
    private container!: HTMLElement;
    private isVisible: boolean = false;

    private strEl!: HTMLElement; private dexEl!: HTMLElement;
    private intEl!: HTMLElement; private conEl!: HTMLElement;
    private wisEl!: HTMLElement; private chaEl!: HTMLElement;

    private tabs: { [key: string]: { btn: HTMLElement, content: HTMLElement } } = {};

    private togglePauseCallback: () => void;
    private bpSlots!: NodeListOf<HTMLElement>;
    private eqMain!: HTMLElement;
    private eqHead!: HTMLElement;
    private eqChest!: HTMLElement;
    private eqPants!: HTMLElement;
    private eqBoots!: HTMLElement;
    private eqGloves!: HTMLElement;
    private eqAmulet!: HTMLElement;
    private eqRing1!: HTMLElement;
    private eqRing2!: HTMLElement;
    private eqRing3!: HTMLElement;
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
        this.eqHead = this.container.querySelector('.eq-head') as HTMLElement;
        this.eqChest = this.container.querySelector('.eq-chest') as HTMLElement;
        this.eqPants = this.container.querySelector('.eq-pants') as HTMLElement;
        this.eqBoots = this.container.querySelector('.eq-boots') as HTMLElement;
        this.eqGloves = this.container.querySelector('.eq-gloves') as HTMLElement;
        this.eqAmulet = this.container.querySelector('.eq-amulet') as HTMLElement;
        this.eqRing1 = this.container.querySelector('.eq-ring1') as HTMLElement;
        this.eqRing2 = this.container.querySelector('.eq-ring2') as HTMLElement;
        this.eqRing3 = this.container.querySelector('.eq-ring3') as HTMLElement;

        this.bpSlots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.equipItemCallback(index);
            });
        });

        this.eqMain.addEventListener('click', () => this.unequipItemCallback('mainHand'));
        this.eqHead.addEventListener('click', () => this.unequipItemCallback('helmet'));
        this.eqChest.addEventListener('click', () => this.unequipItemCallback('chestplate'));
        this.eqPants.addEventListener('click', () => this.unequipItemCallback('pants'));
        this.eqBoots.addEventListener('click', () => this.unequipItemCallback('boots'));
        this.eqGloves.addEventListener('click', () => this.unequipItemCallback('gloves'));
        this.eqAmulet.addEventListener('click', () => this.unequipItemCallback('amulet'));
        this.eqRing1.addEventListener('click', () => this.unequipItemCallback('ring1'));
        this.eqRing2.addEventListener('click', () => this.unequipItemCallback('ring2'));
        this.eqRing3.addEventListener('click', () => this.unequipItemCallback('ring3'));

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
        this.intEl.textContent = attrs.intelligence.toString(); this.conEl.textContent = attrs.constitution.toString();
        this.wisEl.textContent = attrs.wisdom.toString(); this.chaEl.textContent = attrs.charisma.toString();
        this.pointsEl.textContent = attrs.availablePoints.toString();

        this.addBtns.forEach(btn => {
            btn.disabled = attrs.availablePoints <= 0;
        });
        
        if (data.backpack) {
            this.bpSlots.forEach((slot, index) => {
                const item = data.backpack![index];
                if (item) {
                    const itemConfig = Object.values(VisualConfigMap).find(c => (c.category === 'equipment' || c.category === 'weapon') && (c as ItemVisualConfig).iconId === item.iconId) as ItemVisualConfig;
                    if (itemConfig) {
                        slot.innerHTML = `<img src="${itemConfig.uiIconUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">`;
                    } else { slot.innerHTML = ''; slot.textContent = '📦'; }
                    
                    slot.title = item.name;
                    slot.style.borderColor = '#FFD700';
                } else { slot.innerHTML = ''; slot.textContent = ''; slot.title = ''; slot.style.borderColor = '#444'; }
            });
        }
        if (data.equipment) {
            // Helper inteligente para atualizar slots no DOM de forma limpa!
            const updateSlot = (element: HTMLElement, itemData: any, defaultIcon: string, defaultTitle: string) => {
                if (itemData) {
                    const itemConfig = Object.values(VisualConfigMap).find(c => (c.category === 'equipment' || c.category === 'weapon') && (c as ItemVisualConfig).iconId === itemData.iconId) as ItemVisualConfig;
                    if (itemConfig) {
                        element.innerHTML = `<img src="${itemConfig.uiIconUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">`;
                    } else { element.textContent = defaultIcon; }
                    element.title = itemData.name;
                    element.style.borderColor = '#FFD700';
                } else {
                    element.innerHTML = '';
                    element.textContent = defaultIcon;
                    element.title = defaultTitle;
                    element.style.borderColor = '#555';
                }
            };

            updateSlot(this.eqMain, data.equipment.mainHand, '⚔️', 'Mão Principal');
            updateSlot(this.eqHead, data.equipment.helmet, '🪖', 'Capacete');
            updateSlot(this.eqChest, data.equipment.chestplate, '👕', 'Peitoral');
            updateSlot(this.eqPants, data.equipment.pants, '👖', 'Calça');
            updateSlot(this.eqBoots, data.equipment.boots, '🥾', 'Botas');
            updateSlot(this.eqGloves, data.equipment.gloves, '🧤', 'Luvas');
            updateSlot(this.eqAmulet, data.equipment.amulet, '📿', 'Amuleto');
            updateSlot(this.eqRing1, data.equipment.ring1, '💍', 'Anel 1');
            updateSlot(this.eqRing2, data.equipment.ring2, '💍', 'Anel 2');
            updateSlot(this.eqRing3, data.equipment.ring3, '💍', 'Anel 3');
        }
    }
}