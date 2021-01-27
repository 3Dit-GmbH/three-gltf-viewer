import { CustomPropertyNames } from '../util/constants';
let viewer;



const applyVisibility = (propertyValue, object) => {
    if (propertyValue === 1) {
        object.visible = true;
    } else {
        object.visible = false;
    }
    return true;
};

const applyUvAnimation = (propertyValue, object) => {

    const target = viewer.content.getObjectByName(propertyValue);
    const sourceClip = sourceClip || viewer.clips.find((clip) => { if (clip.tracks[0].name.includes(object.name)) return clip })

    target.materialMapOffset = target.material.map.offset
    sourceClip.tracks[0].name = target.name + ".materialMapOffset"
};

const applyLightmap = (propertyValue, object) => {
    if (propertyValue === 1) {

        if (object.type === "Mesh"){           
            emissionToLightmap(object)
        }
        if (object.type === "Group"){
            object.children.forEach(child => {
                emissionToLightmap(child)
            });
            
        }
    }
    return true;
};

const emissionToLightmap = (object) => {
    if (object.material.emissiveMap === null) {
        return;
    }
    object.material.lightMap = object.material.emissiveMap;
    object.material.lightMap.encoding = LinearEncoding;
    object.material.lightMapIntensity = 2;
    object.material.envMapIntensity = 0.1;
    object.material.emissiveMap = null;
    object.material.emissiveIntensity = 0;
};

export const applyProperty = ({
    propertyName, propertyValue, object
}, viewerPassed) => {
    viewer = viewerPassed;
    switch (propertyName) {
        case CustomPropertyNames.visibility:
            return applyVisibility(propertyValue, object);
        case CustomPropertyNames.uvAnim:
            return applyUvAnimation(propertyValue, object);
        case CustomPropertyNames.hasLightmap:
            return applyLightmap(propertyValue, object);
        default:
            return false;
    }
};
