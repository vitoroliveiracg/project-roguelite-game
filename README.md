# project-roguelite-game

RPG roquelite bullet hell like game project

Flag debug: //! Debug

[dontpad](https://dontpad.com/project-roguelite-game)

## TAREFAS MAIORES

* [ ] - Compositor de sprites de personagem (cabelo, cor, olhos)
* [ ] - Compositor de alguns tipos de itens em personagem (capacete, espada)
* [ ] - Tela de seleção de mapas
* [ ] - Compositor de mapas da tela de seleção de mapas
* [ ] - Árvore de habilidades de cada classe
* [ ] - Interface personagem
  * [ ] - Bag
    * [ ] - Itens equipados
  * [ ] - Status
* [ ] - Skilltree
* [ ] - Interface geral
  * [ ] - Seleção de broches
  * [ ] - Status gerais

## REQUISITOS

> Mapa

* Mapa geral contínuo, fast travel para regioes já visitadas


> Armas e Classes

* Habilidades passivas das classes funcionam somente com as classes ativas

* Armas liberam classes mas as classes não são ligadas as armas, pegou o item e libera a classe, mas se tirou, tá desbloqueado


> Iniciar jogo

* World event que favorece uma classe e outro world event que desfavorecem outras classe (Dois tigrinn na tela) - Seu dano de pistola é reduzido e o dano de pistola de inimigos é aumentado; Dano de espada é aumentado e dano de espada de inimigos é diminuido (Pode variar)

* Primeira entrada, NPC fala com você explica as classes base (Guerreiro, Feiticeiro, Mago, Arqueiro, )


> Item Drop

* Item fica no chão se inventário cheio.

* Item tem range de atributos (e muito menor de ter efeito)

* Drops são raros e caem no chão. Pega ao passar perto (3% drop rate)