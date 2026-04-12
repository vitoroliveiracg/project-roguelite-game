import XpBarGui from "../../GUIS/xpBarHudModule/XpBarGui";
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import PlayerStatusGui from "../../GUIS/playerStatusHudModule/PlayerStatusGui";
import CharacterMenuGui from "../../GUIS/characterMenuHudModule/CharacterMenuGui";
import SkillTreeGui from "../../GUIS/skillTreeHudModule/SkillTreeGUI";
import GameOverGui from "../../GUIS/gameoverHudModule/GameOverGui";
import WeaponHudGui from "../../GUIS/weaponHudModule/WeaponHudGui";
import DialogueGui from "../../GUIS/dialogueHudModule/DialogueGui";
import WindowHudGui from "../../GUIS/windowHudModule/WindowHudGui";

/** @class UIManager Gerencia todas as interfaces de usuário baseadas em DOM do jogo. */
export default class UIManager {
  private playerStatusGUI = new PlayerStatusGui();
  private xpBarGui = new XpBarGui();
  private characterMenuGui: CharacterMenuGui;
  private skillTreeGui: SkillTreeGui;
  private gameOverGui: GameOverGui;
  private weaponHudGui: WeaponHudGui;
  public dialogueGui: DialogueGui;
  private windowHudGui = new WindowHudGui();
  private promptEl: HTMLElement;

  constructor(
    togglePauseCallback: () => void, 
    equipItemCallback: (index: number) => void,
    unequipItemCallback: (slot: string, index?: number) => void,
    skillActionCallback: (action: 'unlock' | 'changeClass' | 'equip', payload: any) => void,
    allocateAttributeCallback: (attribute: string) => void,
    restartCallback: () => void,
    deleteItemCallback: (index: number) => void = () => {},
    playerReplyCallback: (message: string, npcId?: number) => void = () => {}
  ) {
    this.characterMenuGui = new CharacterMenuGui(togglePauseCallback, equipItemCallback, unequipItemCallback, allocateAttributeCallback, deleteItemCallback);
    this.skillTreeGui = new SkillTreeGui(togglePauseCallback, skillActionCallback);
    this.gameOverGui = new GameOverGui(restartCallback);
    this.weaponHudGui = new WeaponHudGui();
    this.dialogueGui = new DialogueGui(playerReplyCallback, togglePauseCallback);

    this.promptEl = document.createElement('div');
    this.promptEl.style.position = 'fixed';
    this.promptEl.style.display = 'none';
    this.promptEl.style.transform = 'translate(-50%, -100%)';
    this.promptEl.style.color = '#FFF';
    this.promptEl.style.background = 'rgba(0,0,0,0.85)';
    this.promptEl.style.padding = '6px 12px';
    this.promptEl.style.borderRadius = '6px';
    this.promptEl.style.border = '2px solid #FFD700';
    this.promptEl.style.fontFamily = "'Minecraft', 'Courier New', Courier, monospace";
    this.promptEl.style.pointerEvents = 'none';
    this.promptEl.style.zIndex = '100';
    document.body.appendChild(this.promptEl);
  }

  public showGameOver(): void {
    this.gameOverGui.show();
  }

  public isAnyMenuOpen(): boolean {
    return this.characterMenuGui.isOpen || this.skillTreeGui.isOpen || this.dialogueGui.isOpen;
  }

  public toggleCharacterMenu(): void {
    if (this.dialogueGui.isOpen) return; // Impede sobreposição com o diálogo
    if (!this.characterMenuGui.isOpen) {
      this.skillTreeGui.hide();
    }
    this.characterMenuGui.toggle();
  }

  public toggleSkillTree(): void {
    if (this.dialogueGui.isOpen) return; // Impede sobreposição com o diálogo
    if (!this.skillTreeGui.isOpen) {
      this.characterMenuGui.hide();
    }
    this.skillTreeGui.toggle();
  }

  /** Atualiza as GUIs com os dados mais recentes. */
  public update(playerState: EntityRenderableState | undefined, playerScreenPos?: {x: number, y: number}, mousePos?: {x: number, y: number}): void {
    if (playerState) {
      this.xpBarGui.update(playerState);
      this.playerStatusGUI.update(playerState)
      this.characterMenuGui.update(playerState);
      this.skillTreeGui.update(playerState);
      this.weaponHudGui.update(playerState, playerScreenPos, mousePos);

      // UI de prompt se o Domínio acusar proximidade com um NPC
      if (playerState.interactablePrompt && playerScreenPos && !this.dialogueGui.isOpen) {
        this.promptEl.style.display = 'block';
        this.promptEl.innerText = playerState.interactablePrompt.text;
        this.promptEl.style.left = `${playerScreenPos.x}px`;
        this.promptEl.style.top = `${playerScreenPos.y - 40}px`; // Exibe exatamente acima da cabeça do personagem
      } else {
        this.promptEl.style.display = 'none';
      }
    }
  }
}