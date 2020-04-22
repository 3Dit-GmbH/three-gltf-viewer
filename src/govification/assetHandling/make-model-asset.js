import { makeAnimationController } from '../util/make-govie-controled-animation';
import { CustomPropertyNames } from '../util/constants';

export const makeModelAsset = (url, initalState, viewer) => {
    const modelAsset = {
        url,
    };

    let _isLoaded = false;
    let _isActive = true;

    const _settingListener = [];
    let _currentState = { ...initalState };
    let _scene;
    let _clips;
    let _customProperties;

    const _animationController = makeAnimationController();

    const _notifySettingChanges = () => {
        _settingListener.forEach(cb => cb(_currentState));
    };

    const _activateContent = () => {
        if (_scene && _clips) {
            viewer.activateContent(_scene, _clips);
        }
    };

    const _updateViewer = () => {
        const { mixer, clips, state } = viewer;
        const { actionStates } = state;
        const { animationStates } = _currentState;

        Object.keys(actionStates).forEach((key) => {
            const aniState = (animationStates.find(ele => (ele.name === key)) || {});
            // eslint-disable-next-line no-param-reassign
            actionStates[key] = aniState.loop || false;
        });


        clips.forEach((clip) => {
            const aniState = animationStates.find(ele => (ele.name === clip.name));
            if (!aniState) return;
            const action = mixer.clipAction(clip);

            if (aniState.loop) {
                _animationController.loop(action);
                return;
            }
            if (aniState.pauseAt !== undefined) {
                _animationController.pauseAt(action, aniState.pauseAt * clip.duration);
                return;
            }

            _animationController.stop(action);
            action.timeScale = 1;
            action.stop();
        });
        // update Custom Properties in Viewer
        _customProperties.forEach(cp => { if (cp.propertyName === CustomPropertyNames.visibility) viewer.applyCustomProperty(cp) });
    };

    const _syncSettings = () => {
        if (url === '') return;
        const prevSettings = JSON.stringify(_currentState);
        // check if given animation states are still available as clip
        _currentState.animationStates = (_clips || []).reduce((list, clip) => {
            const state = (
                _currentState.animationStates.find(s => (s.name === clip.name))
                || { name: clip.name, loop: _clips.indexOf(clip) === 0 }
            );
            list.push(state);
            return list;
        }, []);

        // go through existing custom properties and find the state of each prop in the settings
        _currentState.customPropertyStates = _customProperties.map((cp) => {
            // find the corresponding saved state in the settings
            const stateInSettings = _currentState.customPropertyStates.find(
                state => state.id === cp.id,
            );
            if (stateInSettings) { cp.propertyValue = stateInSettings.propertyValue; }
            return {
                id: cp.id,
                objectName: cp.object.name,
                propertyName: cp.propertyName,
                propertyValue: cp.propertyValue,
            };
        });

        // now we have both sources of truth syncronized: the _settings and the _customProperties
        // call updateViewer to apply the models state in the viewer
        if (_isActive) { _updateViewer(); }
        if (prevSettings !== JSON.stringify(_currentState)) {
            _notifySettingChanges(_currentState);
        }
    };

    const updateSettings = (newSettings) => {
        _currentState = { ...newSettings };
        _syncSettings();
    };

    const registerOnSettingChanges = (cb) => {
        _settingListener.push(cb);
    };

    const setActive = (flag) => {
        if (_isActive === flag) { return; }
        _isActive = flag;

        if (_isActive) { _activateContent(_scene, _clips); }
    };

    const handleLoaded = ({ scene, clips, customProps }) => {
        _scene = scene;
        _clips = clips || [];
        _customProperties = customProps;

        _isLoaded = true;
        if (_isActive) {
            _activateContent(_scene, _clips);
            _syncSettings();
        }
    };


    return {
        ...modelAsset,
        getCurrentSettings: () => _currentState,
        updateSettings,
        registerOnSettingChanges,
        isActive: () => _isActive,
        isLoaded: () => _isLoaded,
        setActive,
        handleLoaded,
    };
};
