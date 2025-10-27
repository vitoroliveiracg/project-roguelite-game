/**
 * Define o contrato para qualquer objeto que possa ser desenhado na tela.
 * Este é um modelo de apresentação (ViewModel) e pertence à camada de adaptação.
 */
export default interface Renderable {
  id: number;
  coordinates: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
}