import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import logger from '../utils/logger.js';

export interface WarrantDigestStore {
  get(warrantId: string): Promise<string | undefined>;
  set(warrantId: string, digest: string): Promise<void>;
}

type StoreContents = Record<string, string>;

export interface FileWarrantDigestStoreOptions {
  filePath?: string;
}

export class FileWarrantDigestStore implements WarrantDigestStore {
  private readonly filePath: string;
  private cache: StoreContents | null = null;
  private loadPromise?: Promise<void>;

  constructor(options?: FileWarrantDigestStoreOptions) {
    const defaultPath =
      process.env['WARRANT_DIGEST_STORE_PATH'] ??
      join(process.cwd(), '.relayer', 'warrant-digests.json');
    this.filePath = options?.filePath ?? defaultPath;
  }

  async get(warrantId: string): Promise<string | undefined> {
    await this.load();
    return this.cache?.[warrantId];
  }

  async set(warrantId: string, digest: string): Promise<void> {
    await this.load();
    if (!this.cache) {
      this.cache = {};
    }
    this.cache[warrantId] = digest;
    await this.persist();
  }

  private async load(): Promise<void> {
    if (this.cache) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        try {
          await mkdir(dirname(this.filePath), { recursive: true });
          const fileContents = await readFile(this.filePath, 'utf-8');
          const parsed = JSON.parse(fileContents) as StoreContents;
          if (parsed && typeof parsed === 'object') {
            this.cache = parsed;
          } else {
            this.cache = {};
          }
        } catch (error) {
          const err = error as NodeJS.ErrnoException;
          if (err.code === 'ENOENT') {
            this.cache = {};
            return;
          }
          logger.warn('Failed to load warrant digest store, initializing empty store', {
            filePath: this.filePath,
            error: err.message,
          });
          this.cache = {};
        }
      })();
    }

    await this.loadPromise;
  }

  private async persist(): Promise<void> {
    if (!this.cache) {
      return;
    }

    try {
      await writeFile(this.filePath, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      logger.error('Failed to persist warrant digest to durable store', {
        filePath: this.filePath,
        error: err.message,
      });
      throw error;
    }
  }
}

export class InMemoryWarrantDigestStore implements WarrantDigestStore {
  private readonly store = new Map<string, string>();

  async get(warrantId: string): Promise<string | undefined> {
    return this.store.get(warrantId);
  }

  async set(warrantId: string, digest: string): Promise<void> {
    this.store.set(warrantId, digest);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
