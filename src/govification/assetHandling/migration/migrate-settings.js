import { migrateToV1 } from './migrate-to-v1';

const migrationChain = [
    migrateToV1,
];

export const migrateSettings = (settings) => {
    let migratedSettings = settings;
    migrationChain.forEach((migration) => {
        migratedSettings = migration(migratedSettings);
    });
    return migratedSettings;
};
