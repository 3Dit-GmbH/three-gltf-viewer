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

export const applyProperty = ({
    propertyName, propertyValue, object
}, viewerPassed) => {
    viewer = viewerPassed;
    switch (propertyName) {
        case CustomPropertyNames.visibility:
            return applyVisibility(propertyValue, object);
        case CustomPropertyNames.uvAnim:
            return applyUvAnimation(propertyValue, object);
        default:
            return false;
    }
};
