/** @file Contém a classe InputManager, responsável por gerenciar e mapear todos os inputs do usuário para ações de jogo. */

import { logger } from "../../shared/Logger";
import keymapConfig from '../../assets/keymap.json';
import type { action } from "../../../../domain/eventDispacher/actions.type";

/** Define as ações de jogo possíveis, desacoplando as teclas físicas das ações lógicas. */
export type GameAction = 
  | 'move_up' 
  | 'move_down' 
  | 'move_left' 
  | 'move_right' 
  | 'log_debug' 
  | 'shift' 
  | 'mouse_left'
  | 'mouse_middle'
  | 'mouse_right';

/**  @class InputManager Gerencia todos os inputs do usuário, mapeando eventos brutos de teclado para ações de jogo específicas. Esta classe centraliza a lógica de input, permitindo bindings complexos, combos e remapeamento de teclas. */
export class InputManager {
  private pressedKeys: Set<string> = new Set();
  private keyMap: Map<string, GameAction> = new Map();
  private actionMap: Map<GameAction, string> = new Map();
  public mouseLastCoordinates:{x:number,y:number} = {x:0,y:0} 
  public clickActions: Set<action> = new Set(["leftClick", "scrollClick", "rightClick"])

  /** @constructor Carrega o mapa de teclas a partir da configuração e anexa os listeners de evento. */
  constructor() {
    this.loadKeyMap();
    this.attachEventListeners();
    logger.log('init', 'InputManager instantiated and listening for events.');
  }

  /** Verifica se uma ação de jogo específica está ativa (ou seja, se sua tecla correspondente está pressionada). @param action A ação de jogo a ser verificada. @returns `true` se a ação estiver ativa, `false` caso contrário. */
  public isActionActive(action: GameAction): boolean {
    const key = this.actionMap.get(action);
    return key ? this.pressedKeys.has(key) : false;
  }

  /** Remapeia uma ação de jogo para uma nova tecla, atualizando os mapas internos. @param action A ação a ser remapeada. @param newKey A nova tecla a ser associada à ação. */
  public remapAction(action: GameAction, newKey: string): void {
    const normalizedNewKey = newKey.toLowerCase();

    const oldKey = this.actionMap.get(action);
    if (oldKey) {
      this.keyMap.delete(oldKey);
    }

    this.setKeyForAction(action, normalizedNewKey);
    logger.log('init', `Action '${action}' remapped to key '${normalizedNewKey}'.`);
  }

  /** Carrega o mapa de teclas a partir do arquivo `keymap.json` importado. @private */
  private loadKeyMap(): void {
    Object.entries(keymapConfig).forEach(([action, key]) => {
      this.setKeyForAction(action as GameAction, key as string);
    });
  }

  /** Anexa os listeners de evento de teclado à janela do navegador. @private */
  private attachEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    window.addEventListener('mousemove', this.handleClick.bind(this))
    window.addEventListener('contextmenu', this.handleRightClick.bind(this))
  }

  private handleClick(e: MouseEvent) {
    this.mouseLastCoordinates.x = e.clientX
    this.mouseLastCoordinates.y = e.clientY
  }

  private handleMouseDown(e: MouseEvent) {
    let key = ''
    if (e.button === 0) {
      key = 'mouse_left'
    }
    if (e.button === 1 ) {
      key = 'mouse_middle'
    }
    if (e.button === 2 ) {
      key = 'mouse_right'
    }

    if (!this.pressedKeys.has(key) && this.keyMap.has(key)) {
      logger.log('input', `Mouse Down: ${key}`);
      this.pressedKeys.add(key);
    }
  }

  private handleMouseUp(e: MouseEvent ) {
    let key = ''
    if (e.button === 0) {
      key = 'mouse_left'
    }
    if (e.button === 1 ) {
      key = 'mouse_middle'
    }
    if (e.button === 2 ) {
      key = 'mouse_right'
    }

    logger.log('input', `Mouse Up: ${key}`);
    this.pressedKeys.delete(key);
  }

  // private handleLeftClick(e: PointerEvent ) {}

  private handleRightClick(e: PointerEvent ) {
    e.preventDefault()
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (!this.pressedKeys.has(key) && this.keyMap.has(key)) {
      logger.log('input', `Key Down: ${key}`);
      this.pressedKeys.add(key);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    logger.log('input', `Key Up: ${key}`);
    this.pressedKeys.delete(key);
  }

  /** Define a tecla para uma ação específica, mantendo os mapas sincronizados.  @param action A ação de jogo.  @param key A tecla a ser associada.  @private */
  private setKeyForAction(action: GameAction, key: string): void {
    this.keyMap.set(key, action);
    this.actionMap.set(action, key);
  }
}