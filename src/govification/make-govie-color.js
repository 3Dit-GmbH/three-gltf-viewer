import TWEEN from '@tweenjs/tween.js';
import {
    hexToRgb, rgbToHex, decimalToRgb, rgbToDecimal,
} from './util/convert-color';

export const makeGovieColor = (viewer, colorName, update) => {
    let activeTween;

    const _getColor = () => {
        const value = viewer.state[colorName];
        switch (typeof value) {
        case 'number':
            return decimalToRgb(value);
        case 'object':
            return value;
        case 'string':
        default:
            return hexToRgb(value);
        }
    };

    const _setColor = (col) => {
        const value = viewer.state[colorName];
        switch (typeof value) {
        case 'number':
            viewer.state[colorName] = rgbToDecimal(col);
            break;
        case 'object':
            viewer.state[colorName] = col;
            break;
        case 'string':
        default:
            viewer.state[colorName] = rgbToHex(col);
            break;
        }
    };

    return {
        set: ({
            r = 255, g = 255, b = 255, a = 255,
        }) => {
            const color = {
                r, g, b, a,
            };
            const from = _getColor();
            if (activeTween) activeTween.stop();

            activeTween = new TWEEN.Tween(from)
                .to(color, 500)
                .onUpdate(() => {
                    _setColor(from);
                    update();
                });
            activeTween.start();
        },
    };
};
