import Class from "./Class";
import Skill from "../../../../Skills/Skill";
import type IXPTable from "../../IXPTable";
import type Player from "../Player";
import type { IEventManager } from "../../../../eventDispacher/IGameEvents";
import { BindAction } from "../../../../eventDispacher/ActionBindings";
import type { action } from "../../../../eventDispacher/actions.type";
import Vector2D from "../../../../shared/Vector2D";
import Attack from "../../../Items/Attack";
import Enemy from "../../Enemies/Enemy";

export default class Pescador extends Class {
    private skillsByLevel: Map<number, Skill> = new Map();
    
    // Estado da mecânica de pesca
    private hookedEnemy: Enemy | null = null;
    private accumulatedDamage: number = 0;
    private hookTimeout: ReturnType<typeof setTimeout> | null = null;
    
    // Cooldowns
    private lastDamageTick: number = 0;
    private lastHookTime: number = 0;
    private readonly hookCooldown: number = 1000;

    constructor(xpTable: IXPTable, player: Player, eventManager: IEventManager) {
        super('Pescador', xpTable, player, eventManager);
        // Exemplo de uma passiva inicial temática
        this.skillsByLevel.set(2, new Skill('pesc_t1_fisgada', 'Fisgada Perfeita', 'passive', 1));
    }

    /**
     * Joga o anzol ou move o pescado usando o clique esquerdo
     */
    @BindAction('leftClick')
    public onLeftClick(mouseCoordinates: {x: number, y: number}, action: action) {
        if (this.hookedEnemy) {
            // Se já pescou alguém, o clique esquerdo serve para arrastar
            this.controlHookedEnemy(mouseCoordinates);
        } else {
            // Se não tem ninguém pescado, o clique esquerdo joga o anzol
            const now = Date.now();
            if (now - this.lastHookTime < this.hookCooldown) return;
            this.lastHookTime = now;

            const px = this.player.coordinates.x + this.player.size.width / 2;
            const py = this.player.coordinates.y + this.player.size.height / 2;
            const dir = new Vector2D(mouseCoordinates.x - px, mouseCoordinates.y - py).normalizeMut();

            // O Ataque carregado pelo anzol
            const hookAttack = new Attack(this.player, 5, 'physical', [
                (context) => {
                    const target = context.target;
                    // Verifica se é Enemy (ignora NPCs) e possui HP
                    if (target instanceof Enemy && target.attributes.hp > 0) {
                        // Ignora Bosses
                        if (!target.objectId.toString().toLowerCase().includes('boss')) {
                            this.hookEnemy(target);
                        }
                    }
                }
            ]);

            // Dispara o anzol real mapeado na fábrica!
            this.eventManager.dispatch('spawn', {
                type: 'fishingHook', 
                coordinates: { x: px, y: py },
                direction: dir,
                attack: hookAttack
            });
            
            this.eventManager.dispatch('log', { channel: 'domain', message: 'Anzol lançado!', params: [] });
        }
    }

    private hookEnemy(target: Enemy) {
        if (this.hookedEnemy) return; 
        
        this.hookedEnemy = target;
        this.accumulatedDamage = 0;

        this.eventManager.dispatch('log', { channel: 'domain', message: 'Inimigo pescado!', params: [] });
        // Um feedback visual para mostrar quem foi pescado
        this.eventManager.dispatch('particle', { effect: 'magicAura', x: target.coordinates.x, y: target.coordinates.y, color: '#00aaff' });

        // A duração de 3 segundos sob controle
        this.hookTimeout = setTimeout(() => {
            this.releaseEnemy();
        }, 3000);
    }

    private controlHookedEnemy(mouseCoordinates: {x: number, y: number}) {
        if (!this.hookedEnemy || this.hookedEnemy.attributes.hp <= 0) {
            this.releaseEnemy();
            return;
        }

        // 1. Move o inimigo pescado em direção ao mouse
        const cx = this.hookedEnemy.coordinates.x + this.hookedEnemy.size.width / 2;
        const cy = this.hookedEnemy.coordinates.y + this.hookedEnemy.size.height / 2;
        const dx = mouseCoordinates.x - cx;
        const dy = mouseCoordinates.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            const dir = new Vector2D(dx, dy).normalizeMut();
            const pullSpeed = 12; // Velocidade de arrasto
            this.hookedEnemy.coordinates.x += dir.x * pullSpeed;
            this.hookedEnemy.coordinates.y += dir.y * pullSpeed;
            
            // Sincroniza a hitbox do inimigo forçadamente para o loop do ObjectElementManager não errar
            this.hookedEnemy.hitboxes?.forEach(hb => hb.updatePosition({ 
                x: this.hookedEnemy!.coordinates.x + this.hookedEnemy!.size.width / 2, 
                y: this.hookedEnemy!.coordinates.y + this.hookedEnemy!.size.height / 2 
            }));
            
            // Zera a velocidade física base para ele parar de seguir a IA própria enquanto pescado
            this.hookedEnemy.velocity.resetMut();
        }

        // 2. Dano de colisão com outros inimigos (Bola de Demolição)
        const now = Date.now();
        if (now - this.lastDamageTick > 250) { // Cooldown para não dar 60 instâncias de dano por segundo!
            this.lastDamageTick = now;
            
            this.eventManager.dispatch('requestNeighbors', {
                requester: this.hookedEnemy,
                radius: this.hookedEnemy.size.width + 16, // Raio de colisão estendido
                callback: (neighbors) => {
                    neighbors.forEach(neighbor => {
                        if (neighbor.id !== this.hookedEnemy!.id && neighbor instanceof Enemy) {
                            
                            // Causa dano no vizinho atropelado
                            const damage = 20 + Math.floor(this.player.attributes.strength * 1.5);
                            const attack = new Attack(this.player, damage, 'physical', []);
                            
                            const knockbackDir = new Vector2D(
                                neighbor.coordinates.x - this.hookedEnemy!.coordinates.x, 
                                neighbor.coordinates.y - this.hookedEnemy!.coordinates.y
                            ).normalizeMut();
                            
                            attack.execute(neighbor, knockbackDir);
                            
                            // Acumula o dano para ser descontado no final!
                            this.accumulatedDamage += damage; 
                            this.eventManager.dispatch('particle', { effect: 'bloodSplatter', x: neighbor.coordinates.x, y: neighbor.coordinates.y });
                        }
                    });
                }
            });
        }
    }

    private releaseEnemy() {
        if (!this.hookedEnemy) return;

        // 3. Ao final dos 3 segundos, o pescado toma todo o dano que ele causou (Retribuição!)
        if (this.hookedEnemy.attributes.hp > 0 && this.accumulatedDamage > 0) {
            // True damage para ignorar a defesa
            const finalAttack = new Attack(this.player, this.accumulatedDamage, 'true', []);
            finalAttack.execute(this.hookedEnemy, new Vector2D(0, 0));
            
            this.eventManager.dispatch('log', { channel: 'domain', message: `O pescado sofreu ${this.accumulatedDamage} de retribuição!`, params: [] });
            
            const cx = this.hookedEnemy.coordinates.x + this.hookedEnemy.size.width / 2;
            const cy = this.hookedEnemy.coordinates.y + this.hookedEnemy.size.height / 2;
            this.eventManager.dispatch('particle', { effect: 'criticalStrike', x: cx, y: cy });
        }

        // Limpa os estados
        this.hookedEnemy = null;
        this.accumulatedDamage = 0;
        if (this.hookTimeout) {
            clearTimeout(this.hookTimeout);
            this.hookTimeout = null;
        }
    }

    //? ----------- Skills -----------
    public getSkillForLevel(level: number): Skill | null { return this.skillsByLevel.get(level) || null; }
    public get allSkills(): Skill[] { return Array.from(this.skillsByLevel.values()); }
}