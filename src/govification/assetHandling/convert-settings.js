import {
    getValue, getEnumAttribute, getFloatAttribute, getVersionAttribute, getBooleanAttribute,
} from '../util/handle-attribute';
import { migrateSettings } from './migration/migrate-settings';
import { CustomPropertyNames } from '../util/constants';

const ANIMATION_STATE_PREFIX = 'animation-state:';
const ANIMATION_PAUSED_AT_PREFIX = 'animation-pauseAt:';
const VISIBILITY_STATE_PREFIX = 'visibility-state:';

const getPauseAtID = name => `${ANIMATION_PAUSED_AT_PREFIX}${name}`;

export const readAttributeSettings = (attrSettings) => {
    if (!attrSettings) {
        return {
            animationStates: [],
            customPropertyStates: [],
        };
    }

    // always guarantee latest attribute structure
    const migratedSettings = migrateSettings(attrSettings);

    /* *************  handle attributes related to animation states  *************** */
    const getAnimationStates = (attr) => {
        const name = attr.id.replace(ANIMATION_STATE_PREFIX, '');
        switch (getValue(attr)) {
        default:
        case '0': // stopped animation
            return { name };
        case '1': // animation paused at X
            return {
                name,
                pauseAt: getValue(
                    migratedSettings.find(ele => (ele.id === getPauseAtID(name)))
                        || {},
                ) || 0,
            };
        case '2': // animation runs in loop mode
            return { name, loop: true };
        }
    };

    const filterAnimations = (list, attr) => {
        if (attr.id.startsWith(ANIMATION_STATE_PREFIX)) {
            list.push(getAnimationStates(attr));
        }
        return list;
    };

    /* *************  handle attributes related to custom properties  *************** */
    // read visibility attributes

    const visibilityProperties = migratedSettings.reduce((properties, attr) => {
        // if the id of the attribute doesn't start with our visbilityPrefix, it is not relevant
        if (!attr.id.startsWith(VISIBILITY_STATE_PREFIX)) return properties;

        properties.push(
            {
                id: attr.id.replace(VISIBILITY_STATE_PREFIX, ''),
                propertyValue: attr.defaultValue ? 1 : 0,
                propertyName: CustomPropertyNames.visibility,
                objectName: attr.title,
            },
        );

        return properties;
    }, []);

    return {
        animationStates: migratedSettings.reduce(filterAnimations, []),
        customPropertyStates: [...visibilityProperties],
    };
};


export const writeAttributeSettings = (modelSettings) => {
    if (!modelSettings) { return []; }
    const {
        animationStates = [],
        customPropertyStates = [],
    } = modelSettings;

    const getPauseAttr = (pauseAt, name) => ({
        ...getFloatAttribute({ id: getPauseAtID(name) }),
        min: 0,
        max: 1,
        step: 0.01,
        defaultValue: pauseAt,
    });

    /* *************  convert animation states to attributes  *************** */
    // setting up enum attributes for animation states
    const animationStateAttrs = animationStates.reduce((list, state) => {
        const { name, loop, pauseAt } = state;
        const attr = {
            ...getEnumAttribute({
                id: `${ANIMATION_STATE_PREFIX}${name}`,
            }),
            data: {
                0: 'attribute.animationState.data.stop',
                1: 'attribute.animationState.data.pauseAt',
                2: 'attribute.animationState.data.play',
            },
            title: name.length > 21 ? `${name.slice(0, 20)}...` : name,
            defaultValue: '0',
        };

        if (loop) {
            list.push({ ...attr, defaultValue: '2' });
            return list;
        }

        if (pauseAt !== undefined) {
            list.push({ ...attr, defaultValue: '1' });
            list.push(getPauseAttr(pauseAt, name));
            return list;
        }

        list.push(attr);
        return list;
    }, []);

    /* *************  convert visibility states to attributes  *************** */
    const visbilityAttributes = customPropertyStates.reduce((list, property) => {
        if (property.propertyName !== CustomPropertyNames.visibility) { return list; }
        const booleanAttr = getBooleanAttribute({
            id: `${VISIBILITY_STATE_PREFIX}${property.id}`,
        });
        booleanAttr.defaultValue = (property.propertyValue === 1);
        booleanAttr.title = property.objectName;

        list.push(booleanAttr);
        return list;
    }, []);

    return [
        getVersionAttribute(1),
        ...animationStateAttrs,
        ...visbilityAttributes,
    ];
};
