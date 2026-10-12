/// <reference types="vitest/globals" />

/**
 * Ambient types for the component tests.
 *
 * `vitest.config.mts` sets `globals: true` so `describe`/`it`/`expect` read the
 * same way they do in the Next.js app's server/client boundaries. This
 * declaration is what teaches TypeScript about those globals; without it every
 * test file is a type error.
 */
