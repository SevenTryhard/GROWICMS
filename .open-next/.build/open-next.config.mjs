import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);import bannerUrl from 'url';const __dirname = bannerUrl.fileURLToPath(new URL('.', import.meta.url));

// open-next.config.ts
var config = {
  default: {
    override: {
      wrapper: "cloudflare-nodejs-compat",
      converter: "edge",
      // Use Cloudflare KV for incremental static regeneration
      incrementalCache: {
        kv: {
          binding: "CACHE"
        }
      },
      // Use Cloudflare R2 for static assets
      assets: {
        r2: {
          binding: "STORAGE"
        }
      }
    }
  },
  buildOutputPath: ".open-next",
  functions: {
    server: {
      routes: [
        "/api/*",
        "/dashboard/*"
      ],
      override: {
        wrapper: "cloudflare-nodejs-compat",
        converter: "edge"
      }
    }
  }
};
var open_next_config_default = config;
export {
  open_next_config_default as default
};
