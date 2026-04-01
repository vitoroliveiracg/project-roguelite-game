import XpBarGui from "../../GUIS/xpBarHudModule/XpBarGui";
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";
import PlayerStatusGui from "../../GUIS/playerStatusHudModule/PlayerStatusGui";
import CharacterMenuGui from "../../GUIS/characterMenuHudModule/CharacterMenuGui";
import SkillTreeGui from "../../GUIS/skillTreeHudModule/SkillTreeGUI";

/** @class UIManager Gerencia todas as interfaces de usuário baseadas em DOM do jogo. */
export default class UIManager {
  private playerStatusGUI = new PlayerStatusGui();
  private xpBarGui = new XpBarGui();
  private characterMenuGui: CharacterMenuGui;
  private skillTreeGui: SkillTreeGui;

  constructor(
    togglePauseCallback: () => void, 
    equipItemCallback: (index: number) => void,
    unequipItemCallback: (slot: string) => void,
    skillActionCallback: (action: 'unlock' | 'changeClass', payload: any) => void,
    allocateAttributeCallback: (attribute: string) => void
  ) {
    this.characterMenuGui = new CharacterMenuGui(togglePauseCallback, equipItemCallback, unequipItemCallback, allocateAttributeCallback);
    this.skillTreeGui = new SkillTreeGui(togglePauseCallback, skillActionCallback);
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
  public update(playerState: EntityRenderableState | undefined): void {
    if (playerState) {
      this.xpBarGui.update(playerState);
      this.playerStatusGUI.update(playerState)
      this.characterMenuGui.update(playerState);
      this.skillTreeGui.update(playerState);
    }
  }
}