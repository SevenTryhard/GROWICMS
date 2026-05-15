declare global {
  interface CloudflareEnv {
    DB: D1Database;
    STORAGE: R2Bucket;
    CACHE: KVNamespace;
  }
}

export {};
