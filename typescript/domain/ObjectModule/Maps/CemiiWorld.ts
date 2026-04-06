import GameWorld from "../GameWorld";

export default class CemiiWorld extends GameWorld {
    public readonly mapId = 'cemii';
    public readonly width = 4000;
    public readonly height = 4000;

    public generate(): void {
        this.eventManager.dispatch('log', { channel: 'init', message: 'Gerando o mundo de Cemii...', params: [] });
        
        // Adicione hitboxes estáticas de árvores e ruínas aqui

        this.eventManager.dispatch('log', { channel: 'init', message: 'Mundo de Cemii gerado com sucesso.', params: [] });
    }
}