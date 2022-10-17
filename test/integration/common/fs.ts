import fs from 'node:fs/promises';
import path from 'node:path';
import config from '../config';

export async function createTestDirectory(): Promise<void> {
  await cleanupTestDirectory();
  return createDirectory(config.testDirectory);
}

export function cleanupTestDirectory(): Promise<void> {
  return fs.rm(config.testDirectory, { recursive: true, force: true });
}

export async function createFile(filename: string, content = ''): Promise<void> {
  const fileDirectory = path.dirname(filename);
  try {
    await fs.access(fileDirectory);
  } catch {
    await createDirectory(path.join(config.testDirectory, fileDirectory));
  }
  return fs.writeFile(fullPath(filename), content);
}

function fullPath(filename: string): string {
  return path.resolve(config.testDirectory, filename);
}

async function createDirectory(directory: string) {
  await fs.mkdir(directory, { recursive: true });
}
