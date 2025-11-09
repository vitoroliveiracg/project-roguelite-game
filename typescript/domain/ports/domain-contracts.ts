/** @file Define a fronteira da Arquitetura Hexagonal, contendo os contratos (DTOs e a Porta) que governam a comunicação entre as camadas de Domínio e Adaptação. */

import type { HitboxDebugShape } from "../hitBox/HitBox";
import type { action } from "../eventDispacher/actions.type";
import type { objectTypeId } from "../ObjectModule/objectType.type";

/** DTO (Data Transfer Object) que representa o estado imutável do mundo do jogo, usado para transferir informações do domínio para a apresentação sem expor a entidade `World` interna. */
export interface WorldState {
  /** A largura total do mundo do jogo em unidades (pixels). */
  width: number;
  /** A altura total do mundo do jogo em unidades (pixels). */
  height: number;
}

/** DTO base para o estado de qualquer objeto que pode ser renderizado. */
interface BaseRenderableState {
  /** Identificador numérico único da entidade no domínio, usado para rastreamento. */
  id: number;
  /** As coordenadas {x, y} atuais do objeto no mundo do jogo. */
  coordinates: { x: number; y: number };
  /** As dimensões {width, height} do objeto. */
  size: { width: number; height: number };

  /** Rotação em radianos do objeto */
  rotation:number
}
/** DTO que representa o estado de uma entidade renderizável. A camada de apresentação usa `entityTypeId` e `state` para decidir qual sprite e animação usar. */
export interface EntityRenderableState extends BaseRenderableState {
  /** Identifica o tipo da entidade (ex: 'player') para que a apresentação possa carregar o asset visual correto. */
  entityTypeId: objectTypeId; // Ex: 'player', 'goblin', 'chest'
  /** Descreve o estado comportamental da entidade (ex: 'idle') para que a apresentação possa selecionar a animação correta. */
  state? : string; // Ex: 'idle', 'walking', 'attacking', 'open'
  /** Uma lista opcional de formas de hitbox para depuração visual. */
  hitboxes?: readonly HitboxDebugShape[];

  //? Propriedades específicas para a UI, como a barra de XP.
  /** O nível atual da entidade, se aplicável. */
  level?: number;
  currentXp?: number;
  xpToNextLevel?: number;
}

/** Tipo união para todos os possíveis estados de objetos renderizáveis, permitindo que o sistema seja estendido com outros tipos (ex: partículas) no futuro. */
export type RenderableState = EntityRenderableState; // Por enquanto, só temos entidades

/** @interface IGameDomain Define a "Porta" de entrada para o domínio. A camada de apresentação (GameAdapter) interage com o domínio *exclusivamente* através desta interface, garantindo o desacoplamento. */
export interface IGameDomain {
  /** Aciona a atualização de estado de todas as entidades do domínio a cada tick do game loop. @param deltaTime O tempo, em segundos, desde a última atualização. */
  update(deltaTime: number): void;
  /** Permite que a camada de apresentação configure o contexto do mundo (ex: tamanho do mapa) no domínio durante a inicialização. @param width A largura do mundo. @param height A altura do mundo. */
  setWorld(width: number, height: number): void;
  /** Traduz uma intenção do usuário (capturada pela apresentação) em um comando que o domínio entende. @param command O comando de movimento. */
  handlePlayerInteractions(command: { actions: Array<action> }, mouseLastCoordinates: {x:number,y:number}): void; // eslint-disable-line
  /** Solicita ao domínio uma "fotografia" do estado atual de todos os objetos visíveis, formatada como DTOs puros para a renderização. @returns Um objeto com o estado do mundo e uma lista de DTOs renderizáveis. */
  getRenderState(): { world: WorldState; renderables: readonly RenderableState[] };
}