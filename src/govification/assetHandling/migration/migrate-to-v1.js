import { getEnumAttribute, getValue } from '../../util/handle-attribute';
import { getSettingsVersion, setSettingsVersion } from './handle-settings-version';

export const migrateToV1 = (settings) => {
    // migrate from version 0 to version 1
    if (!Array.isArray(settings) || getSettingsVersion(settings) !== 0) return settings;

    // step 1: change animations from boolean type to enum type
    const newAnimationAttributes = settings.map((attr) => {
        if (!attr.id.startsWith('active-animation:')) { return attr; }

        const enumAttribute = {
            ...getEnumAttribute({
                id: attr.id.replace('active-animation:', 'animation-state:'),
            }),
            title: attr.title,
            data: {
                0: 'Stoppen',
                1: 'Pausieren',
                2: 'Endlos Abspielen',
            },
            defaultValue: getValue(attr) ? '2' : '0',
        };
        return enumAttribute;
    });

    const migratedSettings = setSettingsVersion(newAnimationAttributes, 1);
    return migratedSettings;
};
