import XpBarGui from "../../GUIS/xpBarHudModule/XpBarGui";
import type { EntityRenderableState } from "../../../../domain/ports/domain-contracts";

/** @class UIManager Gerencia todas as interfaces de usuário baseadas em DOM do jogo. */
export default class UIManager {
  private xpBarGui: XpBarGui;

  constructor() {
    this.xpBarGui = new XpBarGui();
  }

  /** Atualiza as GUIs com os dados mais recentes. */
  public update(playerState: EntityRenderableState | undefined): void {
    if (playerState) {
      this.xpBarGui.update(playerState);
    }
  }
}