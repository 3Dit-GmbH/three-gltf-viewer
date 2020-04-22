export const isSameSettings = (s1, s2) => {
    if (!!s1 !== !!s2) return false;
    if (s1.length !== s2.length) return false;

    const idMissmatch = s1.reduce((hasMissmatch, attrS1) => {
        if (!hasMissmatch && !s2.find(attrS2 => attrS2.id === attrS1.id)) {
            hasMissmatch = true;
        }
        return hasMissmatch;
    }, false);

    if (idMissmatch) return false;

    const typeMissmatch = s1.reduce((hasMissmatch, attrS1) => {
        if (!hasMissmatch && s2.find(attrS2 => attrS2.id === attrS1.id).type !== attrS1.type) {
            hasMissmatch = true;
        }
        return hasMissmatch;
    }, false);

    if (typeMissmatch) return false;

    const valueMissmatch = s1.reduce((hasMissmatch, attrS1) => {
        if (!hasMissmatch
            && s2.find(attrS2 => attrS2.id === attrS1.id).defaultValue !== attrS1.defaultValue) {
            hasMissmatch = true;
        }
        return hasMissmatch;
    }, false);

    if (valueMissmatch) return false;

    return true;
};
