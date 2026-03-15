declare module 'tar' {
  export interface ExtractOptions {
    gzip?: boolean;
    cwd?: string;
  }

  export interface ListOptions {
    gzip?: boolean;
  }

  export interface TarEntry {
    path: string;
  }

  export function extract(options: ExtractOptions, files: string[]): Promise<void>;
  export function list(options: ListOptions, files: string[]): Promise<TarEntry[]>;
}
