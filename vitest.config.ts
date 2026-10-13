import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/*.test.ts'],
    // The historical determinism suites replay whole battles step by step and take tens of
    // seconds of real work each; the default cap fails them on a slow or contended machine
    // long before anything is actually stuck.
    testTimeout: 180_000,
    hookTimeout: 180_000,
    // The run is bound by its longest files, not by worker count: six workers finish in the
    // same wall time as one per core (measured 2026-09-20), so eight leave the machine usable.
    maxWorkers: 8,
  },
});
