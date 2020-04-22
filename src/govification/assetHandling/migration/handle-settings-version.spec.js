import expect from 'expect.js';
import { getSettingsVersion, setSettingsVersion } from './handle-settings-version';
import { getVersionAttribute } from '../../util/handle-attribute';

describe('setSettingsVersion', () => {
    it('is a function', () => {
        const actual = typeof setSettingsVersion;
        const expected = 'function';
        expect(actual).equal(expected);
    });

    it('returns an array', () => {
        const actual = setSettingsVersion();
        expect(Array.isArray(actual)).equal(true);
    });

    it('returns an array with a single version attribute per default', () => {
        const version = getVersionAttribute(0);
        const actual = setSettingsVersion();
        const expected = [version];
        expect(actual).eql(expected);
    });

    it('adds a version attribute to the array with the given version', () => {
        const version = getVersionAttribute(5);
        const someStuff = [6, {}];
        const actual = setSettingsVersion(someStuff, 5);
        const expected = [...someStuff, version];
        expect(actual).eql(expected);
    });

    it('replaces given version attributes', () => {
        const version1 = getVersionAttribute(1);
        const version2 = getVersionAttribute(2);
        const someStuff = [6, {}];
        const actual = setSettingsVersion([...someStuff, version1], 2);
        const expected = [...someStuff, version2];
        expect(actual).eql(expected);
    });
});

describe('getSettingsVersion', () => {
    it('is a function', () => {
        const actual = typeof getSettingsVersion;
        const expected = 'function';
        expect(actual).equal(expected);
    });

    it('returns a float', () => {
        const actual = typeof getSettingsVersion();
        const expected = 'number';
        expect(actual).equal(expected);
    });

    it('returns 0 per default', () => {
        const actual = getSettingsVersion();
        const expected = 0;
        expect(actual).equal(expected);
    });

    it('returns the value of the last version attribute', () => {
        const mock = [
            getVersionAttribute(3),
            { some: 'stuff' },
            getVersionAttribute(1),
            { someOther: 'stuff' },
        ];
        const actual = getSettingsVersion(mock);
        const expected = 3;
        expect(actual).equal(expected);
    });
});
