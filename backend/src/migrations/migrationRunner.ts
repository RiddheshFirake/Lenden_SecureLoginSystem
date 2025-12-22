import fs from 'fs';
import path from 'path';
import { database } from '../config/database';

export class MigrationRunner {
  private migrationsPath: string;

  constructor(migrationsPath: string = __dirname) {
    this.migrationsPath = migrationsPath;
  }

  /**
   * Creates the migrations tracking table if it doesn't exist
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await database.query(createTableQuery);
  }

  /**
   * Gets list of already executed migrations
   */
  private async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await database.query('SELECT filename FROM migrations ORDER BY id');
      return result.rows.map((row: any) => row.filename);
    } catch (error) {
      // If table doesn't exist, return empty array
      return [];
    }
  }

  /**
   * Gets list of migration files from the migrations directory
   */
  private getMigrationFiles(): string[] {
    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    return files;
  }

  /**
   * Executes a single migration file
   */
  private async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(this.migrationsPath, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    await database.transaction(async (client) => {
      // Execute the migration SQL
      await client.query(sql);
      
      // Record the migration as executed
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
    });
    
    console.log(`Migration executed: ${filename}`);
  }

  /**
   * Runs all pending migrations
   */
  public async runMigrations(): Promise<void> {
    try {
      await database.connect();
      await this.createMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = this.getMigrationFiles();
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }
      
      console.log(`Running ${pendingMigrations.length} pending migrations...`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  /**
   * Checks if all migrations have been run
   */
  public async checkMigrationStatus(): Promise<{ pending: string[], executed: string[] }> {
    await database.connect();
    await this.createMigrationsTable();
    
    const executedMigrations = await this.getExecutedMigrations();
    const migrationFiles = this.getMigrationFiles();
    
    const pendingMigrations = migrationFiles.filter(
      file => !executedMigrations.includes(file)
    );
    
    return {
      pending: pendingMigrations,
      executed: executedMigrations
    };
  }
}

// Export singleton instance
export const migrationRunner = new MigrationRunner();