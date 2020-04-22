import { VERSION_ATTRIBUTE_ID, getValue, getVersionAttribute } from '../../util/handle-attribute';

export const getSettingsVersion = (settings) => {
    if (!Array.isArray(settings)) { return 0; }
    let version = 0;
    settings.forEach((ele) => {
        if (ele.id === VERSION_ATTRIBUTE_ID) {
            const v = getValue(ele);
            if (v > version) version = v;
        }
    });
    return version;
};

export const setSettingsVersion = (settings, version) => {
    const versionAttribute = getVersionAttribute(version * 1 || 0);
    if (!Array.isArray(settings)) {
        return [versionAttribute];
    }
    const versionFreeSettings = settings.reduce((list, ele) => {
        if (ele.id !== VERSION_ATTRIBUTE_ID) { list.push(ele); }
        return list;
    }, []);
    return [...versionFreeSettings, versionAttribute];
};
