import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config';

export async function createTestDirectory(): Promise<void> {
  await cleanupTestDirectory();
  return createDirectoryRecursively();
}

export function cleanupTestDirectory(): Promise<void> {
  return fs.rm(config.testDirectory, { recursive: true, force: true });
}

/** @param filename May be preceded with one or more directories. */
export async function createFile(filename: string, content = ''): Promise<void> {
  const fileDirectory = path.dirname(filename);
  try {
    await fs.access(fileDirectory);
  } catch {
    await createDirectoryRecursively(fileDirectory);
  }
  return fs.writeFile(fullPath(filename), content);
}

export async function createDirectoryRecursively(...directory: string[]): Promise<void> {
  await fs.mkdir(path.join(config.testDirectory, ...directory), { recursive: true });
}

function fullPath(filename: string): string {
  return path.resolve(config.testDirectory, filename);
}
