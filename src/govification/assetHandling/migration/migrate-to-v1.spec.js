import expect from 'expect.js';
import { migrateToV1 } from './migrate-to-v1';
import { getVersionAttribute } from '../../util/handle-attribute';
import MockedMigration from './mocked_migration_v0_to_v1.json';

describe('migrateToV1', () => {
    it('is a function', () => {
        const actual = typeof migrateToV1;
        const expected = 'function';
        expect(actual).equal(expected);
    });

    it('returns an array', () => {
        const actual = migrateToV1([]);
        expect(Array.isArray(actual)).equal(true);
    });

    it('does nothing if previous version is not 0', () => {
        const versionAttribute = getVersionAttribute(1);
        const mock = [versionAttribute, { what: 'what' }];
        const actual = migrateToV1(mock);
        const expected = mock;
        expect(actual).eql(expected);
    });

    it('does nothing if settings is not an array', () => {
        const versionAttribute = getVersionAttribute(1);
        const mock = [versionAttribute, { what: 'what' }];
        const actual = migrateToV1(mock);
        const expected = mock;
        expect(actual).eql(expected);
    });


    it('migrates settings from version 0 to version 1', () => {
        const actual = migrateToV1(MockedMigration.v0);
        const expected = MockedMigration.v1;
        expect(actual).eql(expected);
    });
});
