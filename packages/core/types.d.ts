declare module 'tar' {
  export interface CreateOptions {
    gzip?: boolean;
    file?: string;
    cwd?: string;
    sync?: boolean;
    strict?: boolean;
    noPax?: boolean;
    noMtime?: boolean;
    filter?: (path: string, stat: any) => boolean;
    map?: (path: string) => string;
    onentry?: (entry: any) => void;
  }

  export interface ExtractOptions {
    gzip?: boolean;
    cwd?: string;
    strip?: number;
    sync?: boolean;
    strict?: boolean;
    unlink?: boolean;
    filter?: (path: string, stat: any) => boolean;
    map?: (path: string) => string;
    onentry?: (entry: any) => void;
  }

  export interface ListOptions {
    gzip?: boolean;
    cwd?: string;
    strip?: number;
    strict?: boolean;
    onentry?: (entry: any) => void;
  }

ReaderOptions export interface TarEntry {
    path: string;
    mode: number;
    uid: number;
    gid: number;
    size: number;
    mtime: Date;
    type: string;
  }

  export function create(options: CreateOptions, ...sources: string[]): void;
  export function extract(options: ExtractOptions, ...sources: string[]): void;
  export function list(options: ListOptions, ...sources: string[]): TarEntry[];
}
