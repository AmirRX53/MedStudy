interface DesktopStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
  export(): Promise<Record<string, string>>;
  import(data: Record<string, string>): Promise<void>;
  clear(): Promise<void>;
}

declare global {
  interface Window {
    medStudyDesktop?: DesktopStorage;
  }
}

export {};
