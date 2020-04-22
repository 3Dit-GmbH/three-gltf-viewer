import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';

import { animateCameraOrientation } from './animate-camera-orientation';

export const makeGovieCamera = (viewer) => {
    const cameraTweens = {
        orbit: undefined,
        autoRotationSpeed: undefined,
        updated: false,
        transitionSpeed: undefined,
        isFirstCameraPosition: true,
    };

    const inputListener = [];

    const { controls } = viewer;

    let currentData;

    const grapCurrentCameraData = () => {
        // get the current positon and rotaiton of the camera from the treejs orbit control
        const camera = new THREE.Vector3(controls.object.position.x,
            controls.object.position.y,
            controls.object.position.z);
        const newData = {
            position: {
                x: camera.x,
                y: camera.y,
                z: camera.z,
            },
            target: {
                x: controls.target.x,
                y: controls.target.y,
                z: controls.target.z,
            },
        };

        currentData = newData;
    };

    const forwardCurrentCameraData = () => {
        // forward the current data to be used in the govie as current camera state
        inputListener.forEach((cb) => {
            cb(currentData);
        });
    };

    // handle user inputs
    const setCameraByUser = () => {
        // if the user changes the camera, we need to stop current tweens invoked by the govie
        if (cameraTweens.orbit) { cameraTweens.orbit.stop(); }
        if (cameraTweens.autoRotationSpeed) { cameraTweens.autoRotationSpeed.stop(); }

        controls.autoRotate = false;

        // keep track of the camera changes invoked by the user
        grapCurrentCameraData();
        // ...and store it in the current govie state
        // this will list the camera state as "dirty" in the govie logic, which means
        // "the current camera state is not, what the govie intended to be,
        // because someone changed it by interaction"
        forwardCurrentCameraData();
    };

    const setupEventHandling = (startEvent, moveEvent, endEvent) => {
        const { domElement } = controls;
        // register on beginning of changes
        domElement.addEventListener(startEvent, () => {
            domElement.addEventListener(moveEvent, setCameraByUser);
        });

        domElement.addEventListener(endEvent, () => {
            domElement.removeEventListener(moveEvent, setCameraByUser);
        });
    };

    setupEventHandling('mousedown', 'mousemove', 'mouseup');
    setupEventHandling('touchstart', 'touchmove', 'touchend');
    controls.domElement.addEventListener('wheel', setCameraByUser);

    // handle govie input
    const setCameraByGovie = (position, target) => {
        const { activeCamera } = viewer;
        const positionVec = new THREE.Vector3(position.x, position.y, position.z);
        const targetVec = new THREE.Vector3(target.x, target.y, target.z);

        // get current theta, phi and distance from position and target
        const theta = controls.getAzimuthalAngle();
        const phi = controls.getPolarAngle();
        const distance = new THREE.Vector3().copy(activeCamera.position)
            .sub(controls.target)
            .length();

        // get target angles and distance
        const spherical = new THREE.Spherical();
        const offset = (new THREE.Vector3(0, 0, 0)).copy(positionVec).sub(targetVec);

        spherical.setFromVector3(offset);
        // spherical.makeSafe();
        const targetTheta = spherical.theta;
        const targetPhi = spherical.phi;
        const targetDistance = spherical.radius;

        // tween these angles and distance
        const from = {
            theta,
            phi,
            distance,
        };

        const to = {
            theta: targetTheta,
            phi: targetPhi,
            distance: targetDistance,
        };

        const disPerSec = 10;
        const anglePerSec = 50;
        const angleBetweenCurAndTarget = new THREE.Vector3().copy(activeCamera.position)
            .sub(controls.target)
            .angleTo(
                new THREE.Vector3().copy(positionVec).sub(targetVec),
            );
        const arc = angleBetweenCurAndTarget * 180 / Math.PI;
        const transitionSpeed = cameraTweens.isFirstCameraPosition ? 0 : cameraTweens.transitionSpeed;
        cameraTweens.isFirstCameraPosition = false;

        // calculate different durations we need to have a smooth movement
        // we take the longest duration for our tween
        const durationOrbit = arc / anglePerSec * 1000 * transitionSpeed;
        const durationDistance = Math.abs(distance - targetDistance) / disPerSec
            * 1000
            * transitionSpeed;
        const durationTarget = 2000 * transitionSpeed;

        if (cameraTweens.orbit) { cameraTweens.orbit.stop(); }

        // tween target and positon of camera with one tween
        // use heleper function to handle tweenable formation
        cameraTweens.orbit = animateCameraOrientation(
            {
                ...from,
                target: controls.target,
            },
            {
                ...to,
                target: targetVec,
            },
            {
                duration: Math.max(durationOrbit, durationDistance, durationTarget),
                update: (tweenedOrientation) => {
                    // update target
                    controls.target.copy(tweenedOrientation.target);

                    // update sperical position from eulers and distance (in respect to target)
                    spherical.phi = tweenedOrientation.phi;
                    spherical.theta = tweenedOrientation.theta;
                    spherical.radius = tweenedOrientation.distance;
                    offset.setFromSpherical(spherical);
                    const newPosition = new THREE.Vector3().copy(controls.target).add(offset);
                    activeCamera.position.copy(newPosition);

                    // update threejs controls to display changes
                    controls.update();
                },
                easing: TWEEN.Easing.Quadratic.Out,
            },
        );

        cameraTweens.orbit.start();
    };


    return {
        setByGovie: (data) => {
            // TODO: prevent govie platform to send back values, we already now
            if (JSON.stringify(currentData) === JSON.stringify(data)) return;
            currentData = data;

            const { position, target } = currentData;
            const positionVec = new THREE.Vector3(position.x, position.y, position.z);
            const targetVec = new THREE.Vector3(target.x, target.y, target.z);
            setTimeout(() => { setCameraByGovie(positionVec, targetVec); }, 50);
        },

        registerInputListener: (cb) => {
            inputListener.push(cb);
        },

        setAutorotate: (value) => {
            controls.autoRotate = value;
            if (cameraTweens.autoRotationSpeed) { cameraTweens.autoRotationSpeed.stop(); }

            if (!value) {
                controls.autoRotateSpeed = 0;
                return;
            }
            const to = {
                autoRotateSpeed: -5,
            };

            cameraTweens.autoRotationSpeed = new TWEEN.Tween(controls)
                .to(to, 2000)
                .easing(TWEEN.Easing.Quadratic.In)
                .onComplete(() => {
                    cameraTweens.autoRotationSpeed = undefined;
                });

            setTimeout(() => {
                cameraTweens.autoRotationSpeed.start();
            }, 50);
        },

        setTransitionSpeed: (value) => {
            switch (value) {
            case 'Slow':
                cameraTweens.transitionSpeed = 4;
                break;
            case 'Fast':
                cameraTweens.transitionSpeed = 0.5;
                break;
            case 'Instant':
                cameraTweens.transitionSpeed = 0;
                break;
            default:
            case 'Normal':
                cameraTweens.transitionSpeed = 1;
                break;
            }
        },

        grapCurrentCameraData,
        forwardCurrentCameraData,
    };
};
