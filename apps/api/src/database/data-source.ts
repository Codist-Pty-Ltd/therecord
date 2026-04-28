import 'reflect-metadata';
import * as path from 'path';
import { config as loadEnv } from 'dotenv';
import { DataSource, type DataSourceOptions } from 'typeorm';

// Load environment variables for CLI usage (migration:generate / run / revert).
// At runtime inside NestJS, ConfigModule handles this — this block exists only
// so the TypeORM CLI can find DATABASE_URL when invoked outside the Nest app.
loadEnv();
loadEnv({ path: path.resolve(__dirname, '..', '..', '..', '..', '.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    '[data-source] DATABASE_URL is not set. ' +
      'Export it in your shell or put it in .env before running migrations.',
  );
}

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  entities: [path.join(__dirname, '..', 'entities', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  /**
   * Per-migration transaction control. Some migrations need DDL outside a
   * transaction block (Postgres refuses `ALTER TYPE ... ADD VALUE` inside
   * transactions), so they set `transaction = false` on the class. That
   * requires the global mode to be "each" — otherwise TypeORM aborts with
   * `ForbiddenTransactionModeOverrideError`.
   */
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: ['error', 'warn', 'migration', 'schema'],
};

/*
 * IMPORTANT: this file MUST export exactly one DataSource instance (and no
 * alias of it). The TypeORM CLI's `loadDataSource` helper refuses to pick
 * when it finds multiple exports of DataSource — even when `default` and
 * a named export point at the same object, it counts them as two.
 *
 * The seed script imports it as a named export (`AppDataSource`); the CLI
 * auto-discovers it. Do NOT re-add `export default` here.
 */
export const AppDataSource = new DataSource(dataSourceOptions);

