import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Company, Meta } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function readJson<T>(name: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(path.join(DATA_DIR, name), 'utf8');
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

export async function getAShares(): Promise<Company[]> {
  return readJson<Company[]>('a-shares.json', []);
}

export async function getHShares(): Promise<Company[]> {
  return readJson<Company[]>('h-shares.json', []);
}

export async function getMeta(): Promise<Meta> {
  return readJson<Meta>('_meta.json', {
    updatedAt: new Date(0).toISOString(),
    counts: {
      aShares: { total: 0, byStatus: {} },
      hShares: { total: 0, byStatus: {} },
    },
  });
}
