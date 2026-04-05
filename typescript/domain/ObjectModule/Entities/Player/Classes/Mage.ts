import Class from "./Class";
import Skill from "../../../../Skills/Skill";
import type IXPTable from "../../IXPTable";
import type Player from "../Player";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents"; 
import Attack from "../../../Items/Attack";
import { BindAction } from "../../../../eventDispacher/ActionBindings";
import type { action } from "../../../../eventDispacher/actions.type";

export default class Mage extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();

    private spellBuffer: action[] = [];
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private readonly SPELL_TIMEOUT = 1500;

    constructor(xpTable: IXPTable, player: Player, eventManager: IEventManager) {
        super('Mago', xpTable, player, eventManager);
        this.skillsByLevel.set(2, new Skill('m_t1_fireball', 'Axioma Inicial', 'active', 1));
        this.skillsByLevel.set(4, new Skill('m_t2_burn', 'Sobrecarga de Mana', 'passive', 2, 'm_t1_fireball'));
        this.skillsByLevel.set(6, new Skill('m_t3_knowledge', 'Conhecimento Profundo', 'passive', 3, 'm_t1_fireball'));
    }

    @BindAction('spell_0')
    @BindAction('spell_1')
    @BindAction('spell_2')
    @BindAction('spell_3')
    @BindAction('spell_4')
    @BindAction('spell_5')
    @BindAction('spell_6')
    @BindAction('spell_7')
    @BindAction('spell_8')
    @BindAction('spell_9')
    public onSpellInput(mouseCoordinates: any, action: action) {
        this.spellBuffer.push(action);
        
        // Trava de segurança: se passar de 9 teclas (overload de magia), a concentração quebra e o buffer limpa
        if (this.spellBuffer.length > 9) {
            this.spellBuffer = [];
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.eventManager.dispatch('log', { channel: 'input', message: "Spell buffer overflow (>9). Concentration broken!", params: [] });
            return;
        }

        this.eventManager.dispatch('log', { channel: 'input', message: `Current Spell Buffer: [${this.spellBuffer.map(s => s.split('_')[1]).join(', ')}]`, params: [] });
        
        if (this.timeoutId) clearTimeout(this.timeoutId);

        if (this.evaluateSpellBuffer()) {
            this.spellBuffer = []; // Magia auto-conjurada com sucesso! Limpa a fila.
        } else {
            this.timeoutId = setTimeout(() => {
                this.spellBuffer = [];
                this.eventManager.dispatch('log', { channel: 'input', message: "Spell buffer expired and cleared.", params: [] });
            }, this.SPELL_TIMEOUT);
        }
    }

    @BindAction('castSpell')
    public onClearSpellBuffer() {
        this.spellBuffer = [];
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.eventManager.dispatch('log', { channel: 'input', message: "Spell buffer cleared manually (Panic Button).", params: [] });
    }

    private evaluateSpellBuffer(): boolean {
        const sequence = this.spellBuffer.join(',');
        const direction = this.player.facingDirection.clone();

        const spawnCoordinates = {
            x: this.player.coordinates.x + this.player.size.width / 2,
            y: this.player.coordinates.y + this.player.size.height / 2
        };
        
        // Dicionário Léxico de Elementos Básicos
        const elementMap: Record<string, string> = {
            'spell_4': 'fire',
            'spell_5': 'water',
            'spell_6': 'nature',
            'spell_7': 'thunder',
            'spell_8': 'light',
            'spell_9': 'magic'
        };

        if (sequence === 'spell_0,spell_4') { //?fireball
            if(this.player.attributes.mana < 5) return false;

            this.player.attributes.mana -= 5;
            const baseDamage = 30 + Math.floor(this.player.attributes.intelligence * 2);
            const playerAttack = new Attack(this.player, baseDamage, 'magical', []);
            this.eventManager.dispatch('spawn', {
                type: 'fireball',
                coordinates: spawnCoordinates,
                direction: direction,
                attack: playerAttack
            });
            this.eventManager.dispatch('log', { channel: 'domain', message: `Cast spell: Fireball!`, params: [] });
            return true;
        } 
        else if (sequence === 'spell_0,spell_5') { //?magicMissile
            const baseDamage = 15 + Math.floor(this.player.attributes.intelligence);
            const playerAttack = new Attack(this.player, baseDamage, 'magical', []);
            this.eventManager.dispatch('spawn', {
                type: 'magicMissile',
                coordinates: spawnCoordinates,
                direction: direction,
                attack: playerAttack
            });
            this.eventManager.dispatch('log', { channel: 'domain', message: `Cast spell: Water Missile!`, params: [] });
            return true;
        }
        // REGRA GERAL (O Lego Visual): Se começou com "Projectile" (spell_0) e possui outros modificadores não catalogados
        else if (this.spellBuffer[0] === 'spell_0' && this.spellBuffer.length > 1) {
            const elements: string[] = [];
            
            // Coleta todas as essências invocadas na sintaxe do mago
            for (let i = 1; i < this.spellBuffer.length; i++) {
                const el = elementMap[this.spellBuffer[i]!];
                if (el) elements.push(el);
            }

            if (elements.length > 0) {
                const manaCost = 2 * elements.length;
                if(this.player.attributes.mana < manaCost) return false;

                this.player.attributes.mana -= manaCost;
                const baseDamage = 10 + (10 * elements.length) + Math.floor(this.player.attributes.intelligence);
                const playerAttack = new Attack(this.player, baseDamage, 'magical', []);
                
                this.eventManager.dispatch('spawn', {
                    type: 'dynamicSpell' as any, // ID para a fábrica genérica
                    coordinates: spawnCoordinates,
                    direction: direction,
                    attack: playerAttack,
                    spellElements: elements
                });
                
                this.eventManager.dispatch('log', { channel: 'domain', message: `Cast Dynamic Spell with elements: [${elements.join(', ')}]!`, params: [] });
                return true;
            }
        }
        return false;
    }

    //? ----------- Skills -----------
    public getSkillForLevel(level: number): Skill | null { return this.skillsByLevel.get(level) || null; }
    public get allSkills(): Skill[] { return Array.from(this.skillsByLevel.values()); }

}