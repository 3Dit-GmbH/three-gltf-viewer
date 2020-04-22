import TWEEN from '@tweenjs/tween.js';
import { setupEventEmitter } from './setup-event-emitter';
import { makeGovieCamera } from './make-govie-camera';
import { makeGovieModel } from './make-govie-model';
import { makeGovieUI } from './make-govie-ui';
import { makeGovieColor } from './make-govie-color';

import environments from '../../assets/environment/index';
import { makeGovieFloat } from './make-govie-float';
import { getFileObject } from './util/get-file-object';

// import { getBooleanAttribute } from './util/handle-attribute';


const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;


const ATTRIBUTE_AND_ACTION_IDS = {
    CAMERA: 0,
    AUTO_ROTATION: 1,
    TRANSITION_SPEED: 2,

    UI_OPEN_CLOSE: 13,
    GRID_ENABLED: 14,
    BACKGROUND_COLOR_1: 15,
    BACKGROUND_COLOR_2: 16,
    AMBIENT_COLOR: 17,
    ENVIRONMENT: 18,
    EXPOSURE: 19,
    GLB_URL: 7,

    // actions
    SAVE_CAMERA: 1000,
};


export const makeGovieApp = (app) => {
    setupEventEmitter();

    // setup viewer
    app.createViewer();
    const { viewer } = app;
    viewer.initCamera();

    // govie controller parts
    const govieCamera = makeGovieCamera(viewer);
    const govieModel = makeGovieModel(app);
    const govieUI = makeGovieUI(viewer);
    const govieBackgroundColor1 = makeGovieColor(viewer, 'bgColor1', () => (viewer.updateBackground()));
    const govieBackgroundColor2 = makeGovieColor(viewer, 'bgColor2', () => (viewer.updateBackground()));
    const govieAmbientColor = makeGovieColor(viewer, 'ambientColor', () => (viewer.updateLights()));
    const govieExposure = makeGovieFloat(() => (viewer.state.exposure), (value) => { viewer.state.exposure = value; viewer.updateLights(); });

    // handle incoming attribute changes
    const handleAttributeSet = (id, value) => {
        switch (id) {
        case ATTRIBUTE_AND_ACTION_IDS.CAMERA:
            govieCamera.setByGovie(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.AUTO_ROTATION:
            govieCamera.setAutorotate(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.TRANSITION_SPEED:
            govieCamera.setTransitionSpeed(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.UI_OPEN_CLOSE:
            govieUI.toggleUI(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.GLB_URL:
            govieModel.load(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.GRID_ENABLED:
            viewer.state.grid = value;
            viewer.updateDisplay();
            break;
        case ATTRIBUTE_AND_ACTION_IDS.BACKGROUND_COLOR_1:
            govieBackgroundColor1.set(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.BACKGROUND_COLOR_2:
            govieBackgroundColor2.set(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.AMBIENT_COLOR:
            govieAmbientColor.set(value);
            break;
        case ATTRIBUTE_AND_ACTION_IDS.ENVIRONMENT:
            viewer.state.environment = environments[value * 1].name;
            viewer.updateEnvironment();
            break;
        case ATTRIBUTE_AND_ACTION_IDS.EXPOSURE:
            govieExposure.set(value);
            break;
        default:
            break;
        }
    };

    window.GovieEventEmitter.registerAttributeSetHandler(handleAttributeSet);
    window.GovieEventEmitter.registerAttributeSetHandler(() => {
        const dom = app.el.querySelector('.viewer');
        dom.style.opacity = 1;
    });

    // handle incoming action invokations
    const handleAction = (id) => {
        switch (id) {
        case ATTRIBUTE_AND_ACTION_IDS.SAVE_CAMERA:
            // update latest state of camera
            govieCamera.grapCurrentCameraData();
            // store it in the apps govie state
            govieCamera.forwardCurrentCameraData();
            // invoke a transition to the platform to store the state in the database
            window.GovieEventEmitter.emit('saveAttribute', ATTRIBUTE_AND_ACTION_IDS.CAMERA);
            break;
        default:
            break;
        }
    };
    window.GovieEventEmitter.registerActionCallHandler(handleAction);

    // handle user input events
    function notifyUserInput(id, value) {
        window.GovieEventEmitter.emit('setAttributeByUser', id, value);
    }

    govieCamera.registerInputListener((value) => {
        notifyUserInput(ATTRIBUTE_AND_ACTION_IDS.CAMERA, value);
    });

    govieModel.registerModelListener((value) => {
        notifyUserInput(ATTRIBUTE_AND_ACTION_IDS.GLB_URL, value);
        window.GovieEventEmitter.emit('saveAttribute', ATTRIBUTE_AND_ACTION_IDS.GLB_URL);
    });

    // game loop
    const animate = (time) => {
        TWEEN.update(time);
        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return {
        loadDefaultModel: (url) => {
            const fileMap = new Map([[
                'testmodel.glb',
                getFileObject,
            ]]);

            app.view(url, '', fileMap);
        },
        notifyLoaded: () => {
            window.GovieEventEmitter.emit('isLoaded');
        },

    };
};
