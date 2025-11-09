//* You can add other asset types here as needed, e.g., '*.png', '*.svg'
/** * This declaration file tells TypeScript how to handle static asset imports. When we import a file ending in .jpeg, TypeScript will understand it as a module that provides a string as its default export (the URL to the asset). */
declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

/**
 * Declaração para o sufixo `?raw` do Vite.
 * Isso informa ao TypeScript que, ao importar um arquivo com esse sufixo,
 * o módulo resultante será uma string contendo o conteúdo bruto do arquivo.
 */
declare module '*?raw' {
  const content: string;
  export default content;
}
