# project-roguelite-game

Um projeto de jogo 2D com estilo RPG, roguelite e bullet hell, construído com TypeScript e focado em uma arquitetura de software robusta e desacoplada.

## Status do Projeto

**Em desenvolvimento ativo.** A base arquitetural está sólida, e as mecânicas principais de combate e movimento estão funcionais.

## Funcionalidades Atuais

- **Motor de Renderização Híbrido:** Utiliza **WebGPU** para alta performance com desenho por instância, com um **fallback automático para Canvas 2D** para garantir compatibilidade.
- **Arquitetura Hexagonal (Portas e Adaptadores):** Lógica de negócio (Domínio) completamente isolada da camada de apresentação (Adaptadores Web), permitindo alta testabilidade e flexibilidade.
- **Combate e Movimento:**
  - Movimentação do jogador em 8 direções.
  - Habilidade de dash.
  - Ataque básico com projéteis direcionados pelo mouse.
- **Inteligência Artificial:**
  - Inimigos (Slimes) que perseguem o jogador.
  - Comportamento de desvio (steering behavior) para evitar que os inimigos se sobreponham.
- **Física e Colisão:**
  - Detecção de colisão desacoplada e performática, executada em um **Web Worker** dedicado.
  - Uso de **Quadtree** no worker para otimizar a busca por colisões em um mundo com muitos objetos.
- **Sistema de Progressão:**
  - Sistema de Atributos (força, destreza, etc.) que influenciam status secundários (velocidade, dano crítico).
  - Ganho de Experiência (XP) ao derrotar inimigos, sistema de Level Up funcional e alocação de pontos de status.
  - Sistema de Classes (Guerreiro, Mago, Gunslinger) com Árvore de Habilidades exclusiva.
  - Destravamento de classes atrelado a encontrar e equipar armas específicas no mundo.
- **Interface e Depuração:**
  - HUD modular com barra de XP e nível do jogador.
  - Modo de depuração para visualização de hitboxes em tempo real.
  - Menu de Personagem (Inventário, Equipamentos e Status) e Menu de Árvore de Habilidades funcionais.
  - Renderização dinâmica de itens caídos no chão (`DroppedItemVisual`).

Flag debug: //! --debug

[dontpad](https://dontpad.com/project-roguelite-game)
[wireframe arquitetura](https://excalidraw.com/#json=M3X7-T5vQh1TGketI9VTW,j3QlQcKjiojxGwGO6_DDVg)
