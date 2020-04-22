import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { pick } from 'underscore';


export const animateVector = (vector, target, options = {}) => {
    // get targets from options or set to defaults
    const from = pick(vector || new THREE.Vector3(), ['x', 'y', 'z']);
    const to = pick(target || new THREE.Vector3(), ['x', 'y', 'z']);
    const easing = options.easing || TWEEN.Easing.Quadratic.Out,
        duration = options.duration || 2000;
    // create the tween
    const tweenVector3 = new TWEEN.Tween(from)
        .to(to, duration)
        .easing(easing)
        .onUpdate(() => {
            if (options.update) {
                options.update(from);
            }
        })
        .onComplete(() => {
            if (options.complete) options.complete();
        });

    // return the tween in case we want to manipulate it later on
    return tweenVector3;
};
