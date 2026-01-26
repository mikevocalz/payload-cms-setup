import * as migration_20260120_001901 from './20260120_001901';
import * as migration_20260126_142438 from './20260126_142438';

export const migrations = [
  {
    up: migration_20260120_001901.up,
    down: migration_20260120_001901.down,
    name: '20260120_001901',
  },
  {
    up: migration_20260126_142438.up,
    down: migration_20260126_142438.down,
    name: '20260126_142438'
  },
];
