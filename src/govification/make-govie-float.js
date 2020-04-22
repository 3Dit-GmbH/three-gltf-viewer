import TWEEN from '@tweenjs/tween.js';

export const makeGovieFloat = (getter, setter) => {
    let activeTween;
    return {
        set: (value) => {
            const from = {
                x: getter(),
            };
            const to = {
                x: value,
            };

            if (activeTween) activeTween.stop();

            activeTween = new TWEEN.Tween(from)
                .to(to, 500)
                .onUpdate(() => {
                    setter(from.x);
                });
            activeTween.start();
        },
    };
};
