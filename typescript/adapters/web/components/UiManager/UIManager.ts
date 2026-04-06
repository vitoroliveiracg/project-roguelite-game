import XpBarGui from "../../GUIS/xpBarHudModule/XpBarGui";
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import PlayerStatusGui from "../../GUIS/playerStatusHudModule/PlayerStatusGui";
import CharacterMenuGui from "../../GUIS/characterMenuHudModule/CharacterMenuGui";
import SkillTreeGui from "../../GUIS/skillTreeHudModule/SkillTreeGUI";
import GameOverGui from "../../GUIS/gameoverHudModule/GameOverGui";
import WeaponHudGui from "../../GUIS/weaponHudModule/WeaponHudGui";

/** @class UIManager Gerencia todas as interfaces de usuário baseadas em DOM do jogo. */
export default class UIManager {
  private playerStatusGUI = new PlayerStatusGui();
  private xpBarGui = new XpBarGui();
  private characterMenuGui: CharacterMenuGui;
  private skillTreeGui: SkillTreeGui;
  private gameOverGui: GameOverGui;
  private weaponHudGui: WeaponHudGui;

  constructor(
    togglePauseCallback: () => void, 
    equipItemCallback: (index: number) => void,
    unequipItemCallback: (slot: string, index?: number) => void,
    skillActionCallback: (action: 'unlock' | 'changeClass', payload: any) => void,
    allocateAttributeCallback: (attribute: string) => void,
    restartCallback: () => void,
    deleteItemCallback: (index: number) => void = () => {}
  ) {
    this.characterMenuGui = new CharacterMenuGui(togglePauseCallback, equipItemCallback, unequipItemCallback, allocateAttributeCallback, deleteItemCallback);
    this.skillTreeGui = new SkillTreeGui(togglePauseCallback, skillActionCallback);
    this.gameOverGui = new GameOverGui(restartCallback);
    this.weaponHudGui = new WeaponHudGui();
  }

  public showGameOver(): void {
    this.gameOverGui.show();
  }

  public toggleCharacterMenu(): void {
    if (!this.characterMenuGui.isOpen) {
      this.skillTreeGui.hide();
    }
    this.characterMenuGui.toggle();
  }

  public toggleSkillTree(): void {
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
    }
  }
}