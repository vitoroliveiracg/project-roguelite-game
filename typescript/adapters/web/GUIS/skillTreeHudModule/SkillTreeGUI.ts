import { logger } from "../../shared/Logger";
import html from './skillTree.html?raw';
import css from './skillTree.css?raw';
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";

/** @class SkillTreeGui Controla a interface da árvore de habilidades isolada. */
export default class SkillTreeGui {
    private container!: HTMLElement;
    private isVisible: boolean = false;
    private lastTreeHash: string = '';
    private togglePauseCallback: () => void;

    constructor(togglePauseCallback: () => void, private skillActionCallback: (action: 'unlock' | 'changeClass', payload: any) => void) {
        this.togglePauseCallback = togglePauseCallback;
        this.injectUI();
        this.hide();
        logger.log('init', 'SkillTreeGui instantiated and UI injected.');
    }

    private injectUI(): void {
        const style = document.createElement('style'); 
        style.textContent = css; 
        document.head.appendChild(style);
        
        const div = document.createElement('div'); 
        div.innerHTML = html;
        this.container = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.container);
    }

    public get isOpen(): boolean { return this.isVisible; }

    public toggle(): void {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'flex' : 'none';
        this.togglePauseCallback();
    }

    public hide(): void { if (this.isVisible) { this.isVisible = false; this.container.style.display = 'none'; this.togglePauseCallback(); } }

    public update(data: EntityRenderableState): void {
        if (!this.isVisible || !data.classes) return;
        
        const hash = JSON.stringify(data.classes) + JSON.stringify(data.skillTree);
        if (this.lastTreeHash === hash) return; // Evita recriar o DOM se não houve mudança real nos nós e classes
        this.lastTreeHash = hash;

        const classSelector = this.container.querySelector('.class-selector') as HTMLElement;
        if (classSelector) {
            classSelector.innerHTML = '';
            data.classes.forEach(cls => {
                const btn = document.createElement('button');
                btn.className = `class-icon ${cls.isActive ? 'active' : (cls.isUnlocked ? 'unlocked' : 'locked')}`;
                btn.title = cls.name;
                btn.textContent = cls.name === 'Mago' ? '🪄' : (cls.name === 'Guerreiro' ? '⚔️' : '🔫');
                btn.onclick = () => this.skillActionCallback('changeClass', { className: cls.name });
                classSelector.appendChild(btn);
            });
        }

        const treeArea = this.container.querySelector('.skill-tree-area') as HTMLElement;
        if (treeArea && data.skillTree && data.skillTree.length > 0) {
            treeArea.innerHTML = '';
            const maxTier = Math.max(0, ...data.skillTree.map(s => s.tier));

            for (let tier = 1; tier <= maxTier; tier++) {
                const skillsInTier = data.skillTree.filter(s => s.tier === tier);
                if (skillsInTier.length === 0) continue;

                const tierDiv = document.createElement('div');
                tierDiv.className = 'skill-tier';

                const label = document.createElement('div');
                label.className = 'tier-label';
                label.textContent = `T${tier}`;
                tierDiv.appendChild(label);

                const nodesDiv = document.createElement('div');
                nodesDiv.className = 'skill-nodes';

                skillsInTier.forEach(skill => {
                    const btn = document.createElement('button');
                    const nodeClass = skill.type === 'active' ? 'active-node' : (skill.type === 'passive' ? 'passive-node' : 'rare-node');
                    const lockClass = skill.unlocked ? 'unlocked' : 'locked';
                    btn.className = `skill-node ${nodeClass} ${lockClass}`;
                    btn.title = skill.name;
                    if (!skill.unlocked && !skill.canUnlock) btn.style.opacity = '0.3';
                    if (skill.canUnlock && !skill.unlocked) btn.style.boxShadow = '0 0 10px #4da6ff'; // Destaque na skill pronta pra comprar
                    btn.onclick = () => this.skillActionCallback('unlock', { skillId: skill.id });
                    nodesDiv.appendChild(btn);
                });
                tierDiv.appendChild(nodesDiv);
                treeArea.appendChild(tierDiv);

                if (tier < maxTier) {
                    const line = document.createElement('div');
                    line.className = 'skill-path-line';
                    treeArea.appendChild(line);
                }
            }
        } else if (treeArea) { treeArea.innerHTML = '<p style="color: #666;">Nenhuma classe selecionada</p>'; }
    }
}