import {
    readAttributeSettings,
    writeAttributeSettings,
} from './assetHandling/convert-settings';
import { makeModelAsset } from './assetHandling/make-model-asset';
import { getFileObject } from './util/get-file-object';

import { isSameSettings } from './assetHandling/is-same-settings';
import { makeGovieCustomProperties } from './make-govie-custom-property';


export const makeGovieModel = (app) => {
    const { viewer } = app;
    viewer.onLoaded = [];
    makeGovieCustomProperties(viewer);
    const modelAttrChangeListener = [];
    const modelAssets = [];
    let lastChange;

    const _updateAssetStates = (url) => {
        modelAssets.forEach((asset) => {
            asset.setActive(asset.url === url);
        });
    };

    const _hasModel = (url) => {
        return modelAssets.findIndex(model => model.url === url) >= 0;
    };

    const _updateModelSettings = (url, settings) => {
        const model = modelAssets.find(m => m.url === url);
        if (!model) return;
        const actual = writeAttributeSettings(model.getCurrentSettings());
        const expected = writeAttributeSettings(settings);
        if (isSameSettings(actual, expected)) return;
        model.updateSettings(settings);
    };

    const _callModelChangeListener = (data) => {
        if (isSameSettings(data.settings, lastChange)) return;
        lastChange = data.settings;
        modelAttrChangeListener.forEach(cb => cb(data));
    };

    const _initalLoadOfAsset = (url, parsedDBSettings) => {
        if (!url || url === '') {
            viewer.clear();
            return;
        }


        const model = makeModelAsset(url, parsedDBSettings, viewer);
        modelAssets.push(model);
        app.showSpinner();

        const cb = ({
            loadedUrl, scene, clips, customProps = [],
        }) => {
            if (loadedUrl !== url) { return; }
            model.handleLoaded({ scene, clips, customProps });
            model.updateSettings(parsedDBSettings);
            viewer.onLoaded = viewer.onLoaded.reduce((list, ele) => {
                if (ele !== cb) { list.push(ele); }
                return list;
            }, []);
        };

        viewer.onLoaded.push(cb);

        model.registerOnSettingChanges((newSettings) => {
            if (model.isActive() && model.url !== '') {
                _callModelChangeListener({
                    url: model.url,
                    settings: writeAttributeSettings(newSettings),
                });
            }
        });

        // do load of new model
        const fileMap = new Map([[
            url,
            getFileObject(url),
        ]]);

        app.view(url, '', fileMap);
    };

    return {
        load: (asset) => {
            let url = '';
            let dbSettings = [];

            // support asset-format 1.0
            if (typeof (asset) === 'string') {
                url = asset;
            }

            // support asset-format 2.0
            if (typeof (asset) === 'object') {
                ({ url, settings: dbSettings } = asset);
            }

            const parsedDBSettings = readAttributeSettings(dbSettings);

            // format check
            const validSettings = writeAttributeSettings(parsedDBSettings);
            lastChange = dbSettings;

            if (!isSameSettings(validSettings)) {
                _callModelChangeListener({
                    url,
                    settings: validSettings,
                });
            }

            // activate one and deactivate others
            _updateAssetStates(url);

            if (_hasModel(url)) {
                // update the models settings
                _updateModelSettings(url, parsedDBSettings);
                return;
            }

            _initalLoadOfAsset(url, parsedDBSettings);
        },

        registerModelListener: (cb) => {
            modelAttrChangeListener.push(cb);
        },
    };
};
