import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve, sep } from 'node:path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export interface StoredObject {
  key: string;
  url: string;
}

export interface ObjectStorage {
  readonly driver: 's3' | 'local';
  put(key: string, body: Buffer, contentType?: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export interface StorageConfig {
  endpoint?: string;
  region: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBaseUrl?: string;
  localDir: string;
}

const KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,254}$/;

function assertKey(key: string): void {
  if (!KEY_PATTERN.test(key) || key.includes('..') || key.includes('//') || isAbsolute(key)) {
    throw new Error(`invalid object key: ${key}`);
  }
}

function createS3Storage(config: StorageConfig): ObjectStorage {
  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    forcePathStyle: Boolean(config.endpoint),
    credentials: config.accessKeyId && config.secretAccessKey
      ? { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
      : undefined,
  });
  const bucket = config.bucket as string;
  const base = (config.publicBaseUrl ?? `${config.endpoint}/${bucket}`).replace(/\/$/, '');

  return {
    driver: 's3',
    async put(key, body, contentType) {
      assertKey(key);
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType ?? 'application/octet-stream',
      }));
      return { key, url: `${base}/${key}` };
    },
    async get(key) {
      assertKey(key);
      const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const bytes = await result.Body?.transformToByteArray();
      return bytes ? Buffer.from(bytes) : null;
    },
    async delete(key) {
      assertKey(key);
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

function createLocalStorage(config: StorageConfig): ObjectStorage {
  const root = resolve(config.localDir);
  const base = (config.publicBaseUrl ?? '/storage').replace(/\/$/, '');

  const target = (key: string): string => {
    assertKey(key);
    const path = resolve(root, join(...key.split('/')));
    if (path !== root && !path.startsWith(root + sep)) throw new Error(`invalid object key: ${key}`);
    return path;
  };

  return {
    driver: 'local',
    async put(key, body) {
      const path = target(key);
      await mkdir(resolve(path, '..'), { recursive: true });
      await writeFile(path, body);
      return { key, url: `${base}/${key}` };
    },
    async get(key) {
      try {
        return await readFile(target(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },
    async delete(key) {
      try {
        await unlink(target(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    },
  };
}

/** S3-compatible storage when fully configured, otherwise local disk. */
export function createStorage(config: StorageConfig): ObjectStorage {
  const complete = Boolean(
    config.endpoint && config.bucket && config.accessKeyId && config.secretAccessKey,
  );
  return complete ? createS3Storage(config) : createLocalStorage(config);
}
