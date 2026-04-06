import GameWorld from "../GameWorld";

export default class AlunWorld extends GameWorld {
    public readonly mapId = 'alun';
    public readonly width = 4000;
    public readonly height = 4000;

    public generate(): void {
        this.eventManager.dispatch('log', { channel: 'init', message: 'Gerando o mundo de Alun...', params: [] });
        
        // Adicione hitboxes estáticas da torre e elevações aqui

        this.eventManager.dispatch('log', { channel: 'init', message: 'Mundo de Alun gerado com sucesso.', params: [] });
    }
}