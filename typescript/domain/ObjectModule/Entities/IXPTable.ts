/**
 * Define a estrutura para uma tabela de experiência,
 * permitindo diferentes curvas de progressão.
 * @argument XP necessário para o nível 2
 * @argument Multiplicador para cada nível subsequente
 */
export default interface IXPTable {
  fixedBase: number;
  levelScale: number;
}