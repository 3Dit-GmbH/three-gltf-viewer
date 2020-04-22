export const getAttribute = ({ id, type }) => ({
    id,
    type,
    title: '',
    subTitle: '',
    defaultValue: undefined,
});

export const getBooleanAttribute = args => (getAttribute({ ...args, type: 'boolean' }));
export const getEnumAttribute = args => (getAttribute({ ...args, data: [], type: 'enum' }));
export const getFloatAttribute = args => (getAttribute({ ...args, type: 'float' }));

// strict version stuff
export const VERSION_ATTRIBUTE_ID = 'version-attribute';
export const getVersionAttribute = version => ({
    ...getFloatAttribute({ id: VERSION_ATTRIBUTE_ID }),
    defaultValue: version,
    hidden: true,
});

export const getValue = attr => (attr.defaultValue);
