/* eslint-disable no-param-reassign */
import TWEEN from '@tweenjs/tween.js';

export const makeAnimationController = () => {
    const activeTimeManipulations = {};

    const _stopTimeManipulation = (action) => {
        const manipulation = activeTimeManipulations[action._clip.uuid];
        if (!manipulation) { return; }
        manipulation.stop();
    };

    const _makePlayFromToManipulation = function (action, from, to) {
        action.play();
        action.timeScale = 0;
        const duration = Math.abs(from - to);
        const easing = TWEEN.Easing.Quadratic.InOut;
        const timeObj = {
            time: from,
        };
        const tweenAnimation = new TWEEN.Tween(timeObj)
            .to({ time: to }, duration * 1000)
            .easing(easing)
            .onUpdate(() => {
                action.time = timeObj.time;
            })
            .onComplete(() => {
                _stopTimeManipulation(action);
            });

        const stopManipulation = () => {
            tweenAnimation.stop();
        };

        tweenAnimation.start();

        activeTimeManipulations[action._clip.uuid] = {
            stop: stopManipulation,
        };
    };

    return {
        stop: (action) => {
            if (!action) return;
            _stopTimeManipulation(action);

            action.timeScale = 0;
            action.stop();
        },

        loop: (action) => {
            if (!action) return;
            _stopTimeManipulation(action);

            action.timeScale = 1;
            action.setLoop(THREE.LoopRepeat);
            action.play();
        },

        pauseAt: (action, time) => {
            if (!action) return;
            _stopTimeManipulation(action);

            const from = action.time;
            const to = time;

            _makePlayFromToManipulation(action, from, to);
        },
    };
};
