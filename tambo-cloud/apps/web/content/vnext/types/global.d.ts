// This tells TypeScript that all .ts/.tsx files are modules
declare module "*" {
  const content: any;
  export default content;
}

// Declare the environment variable
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_HYDRA_API_KEY: string;
  }
}

// Fix path aliases if needed
declare module "@/*" {
  const content: any;
  export default content;
}
