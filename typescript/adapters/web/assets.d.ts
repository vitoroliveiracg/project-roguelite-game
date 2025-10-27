/**
 * This declaration file tells TypeScript how to handle static asset imports.
 * When we import a file ending in .jpeg, TypeScript will understand it as a module
 * that provides a string as its default export (the URL to the asset).
 */
declare module '*.jpeg' {
  const value: string;
  export default value;
}

// You can add other asset types here as needed, e.g., '*.png', '*.svg'