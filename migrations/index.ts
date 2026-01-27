import * as migration_20260120_001901 from "./20260120_001901";
import * as migration_20260127_155700_comments_columns from "./20260127_155700_comments_columns";

export const migrations = [
  {
    up: migration_20260120_001901.up,
    down: migration_20260120_001901.down,
    name: "20260120_001901",
  },
  {
    up: migration_20260127_155700_comments_columns.up,
    down: migration_20260127_155700_comments_columns.down,
    name: "20260127_155700_comments_columns",
  },
];
