import { logger } from "../../shared/Logger";
import html from './characterMenu.html?raw';
import css from './characterMenu.css?raw';
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import { VisualConfigMap, type ItemVisualConfig } from "../../shared/VisualConfigMap";

/** @class CharacterMenuGui Controla a interface principal do personagem com abas (Inv, Status, Skill). */
export default class CharacterMenuGui {
    private container!: HTMLElement;
    private isVisible: boolean = false;
    private globalTooltip!: HTMLElement;

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
    private eqBag!: HTMLElement;
    private pointsEl!: HTMLElement;
    private addBtns!: NodeListOf<HTMLButtonElement>;

    constructor(
        togglePauseCallback: () => void, 
        private equipItemCallback: (index: number) => void,
        private unequipItemCallback: (slot: string, index?: number) => void,
        private allocateAttributeCallback: (attribute: string) => void,
        private deleteItemCallback: (index: number) => void
    ) {
        this.togglePauseCallback = togglePauseCallback;
        this.injectUI();
        this.setupElements();
        this.setupTabs();
        this.setupTooltip();
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

        this.eqMain = this.container.querySelector('#eq-main') as HTMLElement;
        this.eqHead = this.container.querySelector('#eq-head') as HTMLElement;
        this.eqChest = this.container.querySelector('#eq-chest') as HTMLElement;
        this.eqPants = this.container.querySelector('#eq-pants') as HTMLElement;
        this.eqBoots = this.container.querySelector('#eq-boots') as HTMLElement;
        this.eqGloves = this.container.querySelector('#eq-gloves') as HTMLElement;
        this.eqAmulet = this.container.querySelector('#eq-amulet') as HTMLElement;
        this.eqBag = this.container.querySelector('#eq-bag') as HTMLElement;

        this.eqMain.addEventListener('click', () => this.unequipItemCallback('mainHand'));
        this.eqHead.addEventListener('click', () => this.unequipItemCallback('helmet'));
        this.eqChest.addEventListener('click', () => this.unequipItemCallback('chestplate'));
        this.eqPants.addEventListener('click', () => this.unequipItemCallback('pants'));
        this.eqBoots.addEventListener('click', () => this.unequipItemCallback('boots'));
        this.eqGloves.addEventListener('click', () => this.unequipItemCallback('gloves'));
        this.eqAmulet.addEventListener('click', () => this.unequipItemCallback('amulet'));
        this.eqBag.addEventListener('click', () => this.unequipItemCallback('bag'));

        this.container.querySelectorAll('.ring-sub-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const type = slot.getAttribute('data-slot');
                const idx = parseInt(slot.getAttribute('data-index') || '0');
                if (type) this.unequipItemCallback(type, idx);
            });
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
    }

    private setupTooltip(): void {
        this.globalTooltip = document.createElement('div');
        this.globalTooltip.className = 'global-tooltip';
        document.body.appendChild(this.globalTooltip);

        this.container.addEventListener('mouseover', (e) => {
            const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement;
            if (target) {
                const text = target.getAttribute('data-tooltip');
                if (text) {
                    this.globalTooltip.textContent = text;
                    this.globalTooltip.style.display = 'block';
                    
                    // Calcula a posição imediatamente para evitar pulos
                    let x = e.clientX + 15;
                    let y = e.clientY + 15;
                    const rect = this.globalTooltip.getBoundingClientRect();
                    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 10;
                    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10;
                    this.globalTooltip.style.left = `${x}px`;
                    this.globalTooltip.style.top = `${y}px`;
                }
            }
        });

        this.container.addEventListener('mousemove', (e) => {
            if (this.globalTooltip.style.display === 'block') {
                let x = e.clientX + 15;
                let y = e.clientY + 15;

                // Previne que vaze da tela
                const rect = this.globalTooltip.getBoundingClientRect();
                if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 10;
                if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10;

                this.globalTooltip.style.left = `${x}px`;
                this.globalTooltip.style.top = `${y}px`;
            }
        });

        this.container.addEventListener('mouseout', (e) => {
            const target = (e.target as HTMLElement).closest('[data-tooltip]') as HTMLElement;
            if (target) {
                this.globalTooltip.style.display = 'none';
            }
        });
    }

    public get isOpen(): boolean { return this.isVisible; }

    public toggle(): void {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'flex' : 'none';
        if (!this.isVisible && this.globalTooltip) this.globalTooltip.style.display = 'none';
        this.togglePauseCallback();
    }

    public hide(): void { 
        if (this.isVisible) { 
            this.isVisible = false; 
            this.container.style.display = 'none'; 
            if (this.globalTooltip) this.globalTooltip.style.display = 'none'; // Garante que o tooltip soma ao fechar o menu!
            this.togglePauseCallback(); 
        } 
    }

    public update(data: EntityRenderableState): void {
        if (!this.isVisible || !data.attributes) return;
        
        const coinsDisplay = document.getElementById('player-coins-text');
        if (coinsDisplay && data.coins !== undefined) {
            coinsDisplay.innerText = data.coins.toString();
        }

        const buildTooltip = (item: any) => {
            if (!item) return '';
            let text = `${item.name.toUpperCase()}\n`;
            text += `Raridade: ${item.rarity}\n`;
            if (item.baseDamage) text += `Dano: ${item.baseDamage}\n`;
            if (item.capacityBonus) text += `Capacidade: +${item.capacityBonus}\n`;
            return text + `\n${item.description}`;
        };

        const attrs = data.attributes;
        this.strEl.textContent = attrs.strength.toString(); this.dexEl.textContent = attrs.dexterity.toString();
        this.intEl.textContent = attrs.intelligence.toString(); this.conEl.textContent = attrs.constitution.toString();
        this.wisEl.textContent = attrs.wisdom.toString(); this.chaEl.textContent = attrs.charisma.toString();
        this.pointsEl.textContent = attrs.availablePoints.toString();

        this.addBtns.forEach(btn => {
            btn.disabled = attrs.availablePoints <= 0;
        });
        
        const backpackGrid = this.container.querySelector('.backpack-grid') as HTMLElement;
        const targetSlots = data.maxBackpackSize || 24;

        // Recria os slots apenas se o tamanho da bolsa mudou (Desempenho)
        if (backpackGrid && backpackGrid.children.length !== targetSlots) {
            backpackGrid.innerHTML = '';
            for (let i = 0; i < targetSlots; i++) {
                const slot = document.createElement('div');
                slot.className = 'bp-slot';
                slot.addEventListener('click', (e) => {
                    if (e.ctrlKey) this.deleteItemCallback(i);
                    else this.equipItemCallback(i);
                });
                backpackGrid.appendChild(slot);
            }
            this.bpSlots = this.container.querySelectorAll('.bp-slot') as NodeListOf<HTMLElement>;
        }

        if (data.backpack) {
            this.bpSlots?.forEach((slot, index) => {
                const item = data.backpack![index];
                const currentIconId = slot.getAttribute('data-current-icon');
                const newIconId = item ? item.iconId.toString() : 'none';

                if (currentIconId !== newIconId) {
                    slot.setAttribute('data-current-icon', newIconId);
                    if (item) {
                        const itemConfig = Object.values(VisualConfigMap).find(c => (c.category === 'equipment' || c.category === 'weapon') && (c as ItemVisualConfig).iconId === item.iconId) as ItemVisualConfig;
                        if (itemConfig) {
                            slot.innerHTML = `<img src="${itemConfig.uiIconUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">`;
                        } else { slot.innerHTML = '📦'; }
                        
                        slot.setAttribute('data-tooltip', buildTooltip(item));
                        slot.style.borderColor = '#FFD700';
                    } else { slot.innerHTML = ''; slot.removeAttribute('data-tooltip'); slot.style.borderColor = '#444'; }
                }
            });
        }
        if (data.equipment) {
            // Helper inteligente para atualizar slots no DOM de forma limpa!
            const updateSlot = (element: HTMLElement, itemData: any, defaultIcon: string, defaultTitle: string) => {
                const currentIconId = element.getAttribute('data-current-icon');
                const newIconId = itemData ? itemData.iconId.toString() : 'none';
                
                if (currentIconId !== newIconId) {
                    element.setAttribute('data-current-icon', newIconId);
                    if (itemData) {
                        const itemConfig = Object.values(VisualConfigMap).find(c => (c.category === 'equipment' || c.category === 'weapon') && (c as ItemVisualConfig).iconId === itemData.iconId) as ItemVisualConfig;
                        if (itemConfig) {
                            element.innerHTML = `<img src="${itemConfig.uiIconUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">`;
                        } else { element.textContent = defaultIcon; }
                        element.setAttribute('data-tooltip', buildTooltip(itemData));
                        element.style.borderColor = '#FFD700';
                    } else {
                        element.innerHTML = defaultIcon;
                        element.removeAttribute('data-tooltip');
                        element.style.borderColor = '#555';
                    }
                }
            };

            const updateRings = (slotId: string, rings: any[]) => {
                this.container.querySelectorAll(`.ring-sub-slot[data-slot="${slotId}"]`).forEach((slotElement, index) => {
                    const ring = rings[index];
                    const currentIconId = slotElement.getAttribute('data-current-icon');
                    const newIconId = ring ? ring.iconId.toString() : 'none';

                    if (currentIconId !== newIconId) {
                        slotElement.setAttribute('data-current-icon', newIconId);
                        if (ring) {
                            const itemConfig = Object.values(VisualConfigMap).find(c => (c.category === 'equipment') && (c as ItemVisualConfig).iconId === ring.iconId) as ItemVisualConfig;
                            slotElement.innerHTML = itemConfig ? `<img src="${itemConfig.uiIconUrl}" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;">` : '💍';
                            slotElement.setAttribute('data-tooltip', buildTooltip(ring));
                            (slotElement as HTMLElement).style.borderColor = '#FFD700';
                        } else {
                            slotElement.innerHTML = '';
                            slotElement.removeAttribute('data-tooltip');
                            (slotElement as HTMLElement).style.borderColor = '#555';
                        }
                    }
                });
            };

            updateSlot(this.eqMain, data.equipment.mainHand, '⚔️', 'Mão Principal');
            updateSlot(this.eqHead, data.equipment.helmet, '🪖', 'Capacete');
            updateSlot(this.eqChest, data.equipment.chestplate, '👕', 'Peitoral');
            updateSlot(this.eqPants, data.equipment.pants, '👖', 'Calça');
            updateSlot(this.eqBoots, data.equipment.boots, '🥾', 'Botas');
            updateSlot(this.eqGloves, data.equipment.gloves, '🧤', 'Luvas');
            updateSlot(this.eqAmulet, data.equipment.amulet, '📿', 'Amuleto');
            updateSlot(this.eqBag, data.equipment.bag, '🎒', 'Bolsa Extra');
            
            updateRings('leftHandRings', data.equipment.leftHandRings || []);
            updateRings('rightHandRings', data.equipment.rightHandRings || []);
        }
    }
}