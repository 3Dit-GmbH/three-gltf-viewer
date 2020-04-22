import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { pick } from 'underscore';


export const animateCameraOrientation = (from, to, options = {}) => {
    // get targets from options or set to defaults
    const tweenFriendlyFrom = {
        ...pick(from.target || new THREE.Vector3(), ['x', 'y', 'z']),
        phi: from.phi,
        theta: from.theta,
        distance: from.distance,
    };

    const tweenFriendlyTo = {
        ...pick(to.target || new THREE.Vector3(), ['x', 'y', 'z']),
        phi: to.phi,
        theta: to.theta,
        distance: to.distance,
    };

    const easing = options.easing || TWEEN.Easing.Quadratic.Out,
        duration = options.duration || 2000;
    // create the tween
    const tweenVector3 = new TWEEN.Tween(tweenFriendlyFrom)
        .to(tweenFriendlyTo, duration)
        .easing(easing)
        .onUpdate(() => {
            if (options.update) {
                // send a tweened orientation in the from and to format
                options.update({
                    phi: tweenFriendlyFrom.phi,
                    theta: tweenFriendlyFrom.theta,
                    distance: tweenFriendlyFrom.distance,
                    target: new THREE.Vector3(
                        tweenFriendlyFrom.x,
                        tweenFriendlyFrom.y,
                        tweenFriendlyFrom.z,
                    ),
                });
            }
        })
        .onComplete(() => {
            if (options.complete) options.complete();
        });

    // return the tween in case we want to manipulate it later on
    return tweenVector3;
};
