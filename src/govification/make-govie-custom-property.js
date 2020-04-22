import { applyProperty } from './customPropertyHandling/apply-property';
import { CustomPropertyNames } from './util/constants';

const extractProperties = (sceneObjects) => {
    
    
    let result = [];
    sceneObjects.forEach((obj) => {
        if (Object.keys(obj.userData).length > 0) {
            Object.entries(obj.userData).forEach(([name, value]) => {

                // filter properties
                if (!Object.values(CustomPropertyNames).includes(name)) {
                    return
                }
                const property = {
                    id: `${obj.name}_${name}`,
                    propertyName: name,
                    propertyValue: value,
                    object: obj,
                };
                result.push(property);
            });
        }

        if (obj.children.length > 0) {
            result = [...result, ...extractProperties(obj.children)];
        }
    });
    return result;
};


export const makeGovieCustomProperties = (viewer) => {
    viewer.handleCustomProperty = (scene) => {
        const objectsInScene = scene.children;
        const customProperties = extractProperties(objectsInScene);

        customProperties.forEach(p => applyProperty(p, viewer));
        return customProperties;
    };

    viewer.applyCustomProperty = (customProperty) => {
        applyProperty(customProperty, viewer);
    };
};
