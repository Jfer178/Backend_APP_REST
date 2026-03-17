"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const migrator_1 = require("drizzle-orm/node-postgres/migrator");
const index_1 = require("./index");
// This function will run the migrations
async function runMigrations() {
    console.log('Running database migrations...');
    try {
        // Apply migrations
        // This will create tables if they don't exist and will do nothing if they already exist
        await (0, migrator_1.migrate)(index_1.db, { migrationsFolder: 'drizzle' });
        console.log('Database migrations completed successfully');
        return true;
    }
    catch (error) {
        console.error('Error running migrations:', error);
        throw error;
    }
}
// If this file is run directly (not imported), run migrations
if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
}
