import * as migration_20260120_001901 from './20260120_001901';

export const migrations = [
  {
    up: migration_20260120_001901.up,
    down: migration_20260120_001901.down,
    name: '20260120_001901'
  },
];
