/**
 * WarrantDigestStore
 * Interface and implementations for storing and retrieving warrant digests
 * @author Null Foundation
 */

import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

/**
 * Interface for warrant digest storage
 */
export interface WarrantDigestStore {
  /**
   * Store a warrant digest
   * @param warrantId The warrant ID
   * @param digest The warrant digest
   */
  set(warrantId: string, digest: string): Promise<void>;

  /**
   * Retrieve a warrant digest
   * @param warrantId The warrant ID
   * @returns The warrant digest or undefined if not found
   */
  get(warrantId: string): Promise<string | undefined>;

  /**
   * Check if a warrant digest exists
   * @param warrantId The warrant ID
   * @returns True if the digest exists
   */
  has(warrantId: string): Promise<boolean>;

  /**
   * Delete a warrant digest
   * @param warrantId The warrant ID
   */
  delete(warrantId: string): Promise<void>;

  /**
   * Clear all warrant digests
   */
  clear(): Promise<void>;
}

/**
 * In-memory implementation of WarrantDigestStore
 */
export class MemoryWarrantDigestStore implements WarrantDigestStore {
  private store: Map<string, string> = new Map();

  async set(warrantId: string, digest: string): Promise<void> {
    this.store.set(warrantId, digest);
  }

  async get(warrantId: string): Promise<string | undefined> {
    return this.store.get(warrantId);
  }

  async has(warrantId: string): Promise<boolean> {
    return this.store.has(warrantId);
  }

  async delete(warrantId: string): Promise<void> {
    this.store.delete(warrantId);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

/**
 * File-based implementation of WarrantDigestStore
 */
export class FileWarrantDigestStore implements WarrantDigestStore {
  private readonly filePath: string;
  private cache: Map<string, string> = new Map();
  private cacheLoaded = false;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), 'data', 'warrant-digests.json');
  }

  private async ensureDirectory(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async loadCache(): Promise<void> {
    if (this.cacheLoaded) {
      return;
    }

    try {
      await this.ensureDirectory();
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      this.cache = new Map(Object.entries(parsed));
      this.cacheLoaded = true;
      logger.info('Loaded warrant digest cache', { count: this.cache.size });
    } catch (error) {
      // File doesn't exist or is invalid, start with empty cache
      this.cache = new Map();
      this.cacheLoaded = true;
      logger.info('Initialized empty warrant digest cache');
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await this.ensureDirectory();
      const data = Object.fromEntries(this.cache);
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save warrant digest cache', { error });
      throw error;
    }
  }

  async set(warrantId: string, digest: string): Promise<void> {
    await this.loadCache();
    this.cache.set(warrantId, digest);
    await this.saveCache();
  }

  async get(warrantId: string): Promise<string | undefined> {
    await this.loadCache();
    return this.cache.get(warrantId);
  }

  async has(warrantId: string): Promise<boolean> {
    await this.loadCache();
    return this.cache.has(warrantId);
  }

  async delete(warrantId: string): Promise<void> {
    await this.loadCache();
    this.cache.delete(warrantId);
    await this.saveCache();
  }

  async clear(): Promise<void> {
    await this.loadCache();
    this.cache.clear();
    await this.saveCache();
  }
}
