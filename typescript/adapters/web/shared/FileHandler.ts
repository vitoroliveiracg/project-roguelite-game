export default  class FileHandler {
    constructor() {
        
    }

    /**
     * Carrega um arquivo (CSS, HTML, etc.) usando fetch e retorna seu conteúdo como texto.
     * @param {string} url - O caminho para o arquivo.
     * @returns {Promise<string>} - Uma Promise que resolve com o conteúdo do arquivo como string.
     */
    async loadFileText(url:string): Promise<string|null> {
        try {
            const response = await fetch(url);
            const texto = await response.text();
            return texto;
        } catch (error) {
            return null;
        }
    }

}