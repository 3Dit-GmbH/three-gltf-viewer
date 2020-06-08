const THREE = require('three');
const dat = require('dat.gui');
const createVignetteBackground = require('three-vignette-background');
// const Stats = require('../lib/stats.min');
const environments = require('../assets/environment/index');

window.THREE = THREE;


require('three/examples/js/loaders/GLTFLoader');
require('three/examples/js/loaders/DRACOLoader');
require('three/examples/js/loaders/DDSLoader');
require('three/examples/js/controls/OrbitControls');
require('three/examples/js/loaders/RGBELoader');
require('three/examples/js/loaders/HDRCubeTextureLoader');
require('three/examples/js/pmrem/PMREMGenerator');
require('three/examples/js/pmrem/PMREMCubeUVPacker');

THREE.DRACOLoader.setDecoderPath('lib/draco/');

const DEFAULT_CAMERA = '[default]';

const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

// glTF texture types. `envMap` is deliberately omitted, as it's used internally
// by the loader but not part of the glTF format.
const MAP_NAMES = [
    'map',
    'aoMap',
    'emissiveMap',
    'glossinessMap',
    'metalnessMap',
    'normalMap',
    'roughnessMap',
    'specularMap',
];

const toneMappingOptions = {
    None: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Uncharted2: THREE.Uncharted2ToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping
}

const Preset = { ASSET_GENERATOR: 'assetgenerator' };

module.exports = class Viewer {
    constructor(el, options) {
        this.el = el;
        this.options = options;

        this.lights = [];
        this.content = null;
        this.mixer = null;
        this.clips = [];
        this.gui = null;
        this.customProps = [];

        window.Viewer = this;


        this.state = {
            environment: options.preset === Preset.ASSET_GENERATOR ?
                'Footprint Court (HDR)' : environments[3].name,
            background: false,
            playbackSpeed: 1.0,
            actionStates: {},
            toneMapping: toneMappingOptions.Uncharted2,


            // gove addon: keep list of animations
            actions: {},

            camera: DEFAULT_CAMERA,
            wireframe: false,
            skeleton: false,
            grid: false,

            // Lights
            addLights: true,
            exposure: 1.0,
            textureEncoding: 'sRGB',
            ambientIntensity: 2,
            ambientColor: 0x000000,
            directIntensity: 2, //0.8 * Math.PI, // TODO(#116)
            directColor: 0xFFF5D9,
            bgColor1: '#F1F1F1',
            bgColor2: '#353535',
        };

        this.prevTime = 0;

        // govie addon: remove stats
        // this.stats = new Stats();
        // this.stats.dom.height = '48px';

        // [].forEach.call(this.stats.dom.children, child => (child.style.display = ''));

        this.scene = new THREE.Scene();

        const fov = options.preset === Preset.ASSET_GENERATOR ?
            0.8 * 180 / Math.PI :
            60;
        this.defaultCamera = new THREE.PerspectiveCamera(fov, el.clientWidth / el.clientHeight, 0.01, 1000);

        // govie addon: changed scale object instead of move camera
        this.defaultCamera.near = 0.01;
        this.defaultCamera.far = 100;
        this.defaultCamera.updateProjectionMatrix();

        this.activeCamera = this.defaultCamera;
        // this.scene.add(this.defaultCamera);

        this.renderer = window.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.physicallyCorrectLights = true;
        this.renderer.gammaOutput = true;
        this.renderer.gammaFactor = 2.2;
        this.renderer.setClearColor(0xcccccc);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(el.clientWidth, el.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.toneMapping = THREE.ACESFilmicToneMapping;


        this.updateToneMapping();

        this.controls = new THREE.OrbitControls(this.defaultCamera, this.renderer.domElement);
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0;
        this.controls.screenSpacePanning = true;

        this.controls.maxDistance = 100;
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.2;
        this.controls.rotateSpeed = 0.2;
        this.controls.panSpeed = 0.4;


        this.background = createVignetteBackground({
            aspect: this.defaultCamera.aspect,
            grainScale: IS_IOS ? 0 : 0.001, // mattdesl/three-vignette-background#1
            colors: [this.state.bgColor1, this.state.bgColor2],
            scale: 1.5,
        });

        this.el.appendChild(this.renderer.domElement);

        this.cameraCtrl = null;
        this.cameraFolder = null;
        this.animFolder = null;
        this.animCtrls = [];
        this.morphFolder = null;
        this.morphCtrls = [];
        this.skeletonHelpers = [];
        this.gridHelper = null;
        this.axesHelper = null;



        // govie addon: removing gui
        // this.addGUI();
        // if (options.kiosk) this.gui.close();

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
        window.addEventListener('resize', this.resize.bind(this), false);
        // this.initCamera();
    }

    animate(time) {
        requestAnimationFrame(this.animate);

        const dt = (time - this.prevTime) / 1000;

        this.controls.update();

        // govie addon: remove stats
        // this.stats.update();

        this.mixer && this.mixer.update(dt);
        this.render();

        this.prevTime = time;
    }

    render() {
        this.renderer.render(this.scene, this.activeCamera);
    }

    resize() {
        const { clientHeight, clientWidth } = this.el.parentElement;

        this.defaultCamera.aspect = clientWidth / clientHeight;
        this.defaultCamera.updateProjectionMatrix();
        this.background.style({ aspect: this.defaultCamera.aspect });
        this.renderer.setSize(clientWidth, clientHeight);
    }

    load(url, rootPath, assetMap) {
        const baseURL = THREE.LoaderUtils.extractUrlBase(url);

        // Load.
        return new Promise((resolve, reject) => {
            const manager = new THREE.LoadingManager();

            // Intercept and override relative URLs.
            manager.setURLModifier((url, path) => {
                const normalizedURL = rootPath + url
                    .replace(baseURL, '')
                    .replace(/^(\.?\/)/, '');

                if (assetMap.has(normalizedURL)) {
                    const blob = assetMap.get(normalizedURL);
                    const blobURL = URL.createObjectURL(blob);
                    blobURLs.push(blobURL);
                    return blobURL;
                }

                return (path || '') + url;
            });

            const loader = new THREE.GLTFLoader(manager);
            loader.setCrossOrigin('anonymous');
            loader.setDRACOLoader(new THREE.DRACOLoader());
            const blobURLs = [];
            loader.load(url, (gltf) => {
                gltf.scene.traverse(function(node) {

                    if (node.isMesh) {
                        node.castShadow = true;
                        if (node.material.aoMap)
                            node.material.lightMap = node.material.aoMap

                    }
                    // node.castShadow = true;


                });
                const scene = gltf.scene || gltf.scenes[0];
                const clips = gltf.animations || [];

                this.setContent(scene, clips);

                // govie addon : handle and get custom props
                const customProps = this.handleCustomProperty(scene);
                this.customProps = customProps;
                // this.playAllClips();

                // govie addon: add custom gui
                this.addCustomGUI();

                // govie addon: loading callback
                if (this.onLoaded && this.onLoaded.length) {
                    this.onLoaded.forEach((cb) => {
                        cb({
                            loadedUrl: url,
                            scene,
                            clips,
                            customProps,
                        });
                    });
                }

                blobURLs.forEach(URL.revokeObjectURL);

                // See: https://github.com/google/draco/issues/349
                // THREE.DRACOLoader.releaseDecoderModule();
                resolve(gltf);
            }, undefined, reject);
        });
    }

    // govie addon: init camera
    initCamera() {
        this.defaultCamera.near = 0.001;
        this.defaultCamera.far = 100;
        this.defaultCamera.updateProjectionMatrix();

        const center = new THREE.Vector3(0, 0, 0);

        this.defaultCamera.position.copy(center);
        this.defaultCamera.position.x += 2.0;
        this.defaultCamera.position.y += 5.0;
        this.defaultCamera.position.z += 14.0;
        this.defaultCamera.lookAt(center);

        this.setCamera(DEFAULT_CAMERA);
    }

    /**
     * @param {THREE.Object3D} object
     * @param {Array<THREE.AnimationClip} clips
     */
    setContent(object, clips) {
        this.clear();

        object.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());

        // govie addon: scale object instead of changing camera
        const size = box.getSize(new THREE.Vector3());

        const maxXZ = 10;
        const minXZ = 1;
        const scale = (Math.max(size.x, size.z) > maxXZ) ? maxXZ / Math.max(size.x, size.z) :
            (Math.min(size.x, size.z) < minXZ) ? minXZ / Math.max(size.x, size.z) :
            1;

        object.scale.set(scale, scale, scale);

        object.position.x += (object.position.x - center.x * scale);
        object.position.y += (object.position.y - center.y * scale);
        object.position.z += (object.position.z - center.z * scale);


        // this.controls.maxDistance = size * 10;
        // this.defaultCamera.near = size / 100;
        // this.defaultCamera.far = size * 100;
        // this.defaultCamera.updateProjectionMatrix();


        // govie addon: removed camera positioning
        /* if (this.options.cameraPosition) {
            this.defaultCamera.position.fromArray(this.options.cameraPosition);
            this.defaultCamera.lookAt(new THREE.Vector3());
        } else {
            this.defaultCamera.position.copy(center);
            this.defaultCamera.position.x += size / 2.0;
            this.defaultCamera.position.y += size / 5.0;
            this.defaultCamera.position.z += size / 2.0;
            this.defaultCamera.lookAt(center);
        } */

        // this.setCamera(DEFAULT_CAMERA);

        // this.controls.saveState();

        // this.scene.add(object);
        this.scene = object;
        this.content = object;

        this.state.addLights = true;
        this.content.traverse((node) => {
            if (node.isLight) {
                this.state.addLights = false;
            }
        });

        this.setClips(clips);

        this.updateLights();

        // govie addon: removing gui
        // this.updateGUI();

        this.updateEnvironment();
        this.updateTextureEncoding();
        this.updateDisplay();

        window.content = this.content;

        // govie addon: removed scene graph print
        /*
        console.info('[glTF Viewer] THREE.Scene exported as `window.content`.');
        this.printGraph(this.content);
        */

        // govie addon: activeate backface culling
        traverseMaterials(this.content, (material) => {
            material.side = THREE.DoubleSide;
            // material.flatShading = false;
        });
    }

    // govie addon: store original position
    activateContent(object, clips) {
        this.clear();

        object.updateMatrixWorld();
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());


        this.controls.maxDistance = size * 10;
        // this.defaultCamera.near = size / 100;
        this.defaultCamera.far = size * 100;
        this.defaultCamera.updateProjectionMatrix();

        this.scene.add(object);

        this.content = object;

        this.state.addLights = true;
        this.content.traverse((node) => {
            if (node.isLight) {
                this.state.addLights = false;
            }
        });

        this.setClips(clips);

        this.updateLights();

        // govie addon: removing gui
        // this.updateGUI();

        this.updateEnvironment();
        this.updateTextureEncoding();
        this.updateDisplay();

        window.content = this.content;
    }

    printGraph(node) {
        console.group(` <${node.type}> ${node.name}`);
        node.children.forEach(child => this.printGraph(child));
        console.groupEnd();
    }

    /**
     * @param {Array<THREE.AnimationClip} clips
     */
    setClips(clips) {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mixer.getRoot());
            this.mixer = null;
        }

        clips.forEach((clip) => {
            if (clip.validate()) clip.optimize();
        });

        this.clips = clips;
        if (!clips.length) return;

        this.mixer = new THREE.AnimationMixer(this.content);
    }

    playAllClips() {
        this.clips.forEach((clip) => {
            this.mixer.clipAction(clip).reset().play();
            this.state.actionStates[clip.name] = true;
        });
    }

    /**
     * @param {string} name
     */
    setCamera(name) {
        if (name === DEFAULT_CAMERA) {
            this.controls.enabled = true;
            this.activeCamera = this.defaultCamera;
        } else {
            this.controls.enabled = false;
            this.content.traverse((node) => {
                if (node.isCamera && node.name === name) {
                    this.activeCamera = node;
                }
            });
        }
    }

    updateTextureEncoding() {
        const encoding = this.state.textureEncoding === 'sRGB' ?
            THREE.sRGBEncoding :
            THREE.LinearEncoding;
        traverseMaterials(this.content, (material) => {
            if (material.map) material.map.encoding = encoding;
            if (material.emissiveMap) material.emissiveMap.encoding = encoding;
            if (material.map || material.emissiveMap) material.needsUpdate = true;
        });
    }

    updateLights() {
        const state = this.state;
        const lights = this.lights;

        if (state.addLights && !lights.length) {
            this.addLights();
        } else if (!state.addLights && lights.length) {
            this.removeLights();
        }

        this.renderer.toneMappingExposure = state.exposure;

        if (lights.length === 2) {
            lights[0].intensity = state.ambientIntensity;
            lights[0].color.setHex(state.ambientColor);
            lights[1].intensity = state.directIntensity;
            lights[1].color.setHex(state.directColor);
        }
    }

    addLights() {
        const state = this.state;

        if (this.options.preset === Preset.ASSET_GENERATOR) {
            const hemiLight = new THREE.HemisphereLight();
            hemiLight.name = 'hemi_light';
            this.scene.add(hemiLight);
            this.lights.push(hemiLight);
            return;
        }

        const light1 = new THREE.AmbientLight(state.ambientColor, state.ambientIntensity);
        light1.name = 'ambient_light';
        this.defaultCamera.add(light1);

        const light2 = new THREE.DirectionalLight(state.directColor, state.directIntensity);
        light2.position.set(0.5, 0, 0.866); // ~60º
        light2.name = 'main_light';
        this.defaultCamera.add(light2);

        this.lights.push(light1, light2);
    }

    removeLights() {
        this.lights.forEach(light => light.parent.remove(light));
        this.lights.length = 0;
    }

    updateEnvironment() {
        const environment = environments.filter(entry => entry.name === this.state.environment)[0];

        this.getCubeMapTexture(environment).then(({ envMap, cubeMap }) => {
            if ((!envMap || !this.state.background) && this.activeCamera === this.defaultCamera) {
                this.scene.add(this.background);
            } else {
                this.scene.remove(this.background);
            }

            /* govie addon: remember loaded environments */
            environment.isLoaded = true;
            environment.envMap = envMap;
            environment.cubeMap = cubeMap;

            traverseMaterials(this.content, (material) => {
                if (material.isMeshStandardMaterial || material.isGLTFSpecularGlossinessMaterial) {
                    material.envMap = envMap;
                    material.needsUpdate = true;
                }
            });

            this.scene.background = this.state.background ? cubeMap : null;
        });
    }

    getCubeMapTexture(environment) {
        const {
            path,
            format,
            isLoaded,
            envMap,
            cubeMap,
        } = environment;

        /* govie addon: remember loaded environments */
        if (isLoaded) {
            return Promise.resolve({ envMap, cubeMap });
        }

        // no envmap
        if (!path) return Promise.resolve({ envMap: null, cubeMap: null });

        const cubeMapURLs = [
            `${path}posx${format}`, `${path}negx${format}`,
            `${path}posy${format}`, `${path}negy${format}`,
            `${path}posz${format}`, `${path}negz${format}`,
        ];

        // hdr
        if (format === '.hdr') {
            return new Promise((resolve) => {
                new THREE.HDRCubeTextureLoader().load(THREE.UnsignedByteType, cubeMapURLs, (hdrCubeMap) => {
                    hdrCubeMap.magFilter = THREE.LinearFilter;
                    hdrCubeMap.minFilter = THREE.LinearFilter;

                    const pmremGenerator = new THREE.PMREMGenerator(hdrCubeMap, 128);
                    pmremGenerator.update(this.renderer);

                    const pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
                    pmremCubeUVPacker.update(this.renderer);

                    resolve({
                        envMap: pmremCubeUVPacker.CubeUVRenderTarget.texture,
                        cubeMap: hdrCubeMap,
                    });
                });
            });
        }

        // standard
        const loadedEnvMap = new THREE.CubeTextureLoader().load(cubeMapURLs);
        loadedEnvMap.format = THREE.RGBFormat;
        return Promise.resolve({ envMap: loadedEnvMap, cubeMap: loadedEnvMap });
    }

    updateDisplay() {
        if (this.skeletonHelpers.length) {
            this.skeletonHelpers.forEach(helper => this.scene.remove(helper));
        }

        if (this.content) {
            traverseMaterials(this.content, (material) => {
                material.wireframe = this.state.wireframe;
            });

            this.content.traverse((node) => {
                if (node.isMesh && node.skeleton && this.state.skeleton) {
                    const helper = new THREE.SkeletonHelper(node.skeleton.bones[0].parent);
                    helper.material.linewidth = 3;
                    this.scene.add(helper);
                    this.skeletonHelpers.push(helper);
                }
            });
        }

        if (this.state.grid !== Boolean(this.gridHelper)) {
            if (this.state.grid) {
                this.gridHelper = new THREE.GridHelper();
                this.scene.add(this.gridHelper);

                // govie addon: removed axes
                /*
                    this.axesHelper = new THREE.AxesHelper();
                    this.axesHelper.renderOrder = 999;
                    this.axesHelper.onBeforeRender = renderer => renderer.clearDepth();
                    this.scene.add(this.axesHelper);
                    */
            } else {
                this.scene.remove(this.gridHelper);
                this.scene.remove(this.axesHelper);
                this.gridHelper = null;
                this.axesHelper = null;
            }
        }
    }

    updateBackground() {
        this.background.style({ colors: [this.state.bgColor1, this.state.bgColor2] });
    }


    addCustomGUI() {
        const gui = this.gui = new dat.GUI();

        // Animation controls
        this.animFolder = gui.addFolder('Animation');

        if (this.clips.length) {

            this.clips.forEach((clip) => {
                clip.isPlaying = false;

                const ctrl = this.animFolder.add(clip, "isPlaying").onChange(
                        () => {
                            if (clip.isPlaying) {
                                this.mixer.clipAction(clip).play();
                            } else {
                                this.mixer.clipAction(clip).stop();
                            }
                        })
                    .name(clip.name)
            });
        }

        // Custom Property
        const tempViewer = this;
        this.visFolder = gui.addFolder('Visibility');

        this.customProps.forEach((prop) => {
            prop.checkbox = prop.propertyValue == 1
            this.visFolder.add(prop, "checkbox").onChange(() => {
                prop.propertyValue = prop.checkbox ? 1 : 0;
                tempViewer.applyCustomProperty(prop)
            }).name(prop.object.name)
        })

        // Lighting controls.
        const lightFolder = gui.addFolder('Lighting');
        const envMapCtrl = lightFolder.add(this.state, 'environment', environments.map(env => env.name));
        envMapCtrl.onChange(() => this.updateEnvironment());
        [
            lightFolder.add(this.state, 'exposure', 0, 2).name("Brightness"),
            lightFolder.add(this.state, 'directIntensity', 0, 4).name("Camera Light"), // TODO(#116)
            // lightFolder.add(this.state, 'addLights').listen(),
            lightFolder.add(this.state, 'ambientIntensity', 0, 2).name("Ambient"),
            lightFolder.addColor(this.state, 'ambientColor'),
            // lightFolder.addColor(this.state, 'directColor'),
        ].forEach(ctrl => ctrl.onChange(() => this.updateLights()));

    }

    addGUI() {
        const gui = this.gui = new dat.GUI({ autoPlace: false, width: 260, hideable: true });

        // Display controls.
        const dispFolder = gui.addFolder('Display');
        const envBackgroundCtrl = dispFolder.add(this.state, 'background');
        envBackgroundCtrl.onChange(() => this.updateEnvironment());
        const wireframeCtrl = dispFolder.add(this.state, 'wireframe');
        wireframeCtrl.onChange(() => this.updateDisplay());
        const skeletonCtrl = dispFolder.add(this.state, 'skeleton');
        skeletonCtrl.onChange(() => this.updateDisplay());
        const gridCtrl = dispFolder.add(this.state, 'grid').listen();
        gridCtrl.onChange(() => this.updateDisplay());
        dispFolder.add(this.controls, 'autoRotate');
        dispFolder.add(this.controls, 'screenSpacePanning');
        const bgColor1Ctrl = dispFolder.addColor(this.state, 'bgColor1');
        const bgColor2Ctrl = dispFolder.addColor(this.state, 'bgColor2');
        bgColor1Ctrl.onChange(() => this.updateBackground());
        bgColor2Ctrl.onChange(() => this.updateBackground());

        // Lighting controls.
        const lightFolder = gui.addFolder('Lighting');
        const encodingCtrl = lightFolder.add(this.state, 'textureEncoding', ['sRGB', 'Linear']);
        encodingCtrl.onChange(() => this.updateTextureEncoding());
        const toneMapping = lightFolder.add(this.state, 'toneMapping', ['Cinematic', 'Linear', 'Reinhard', 'Uncharted', 'No']);
        toneMapping.onChange(() => this.updateToneMapping());
        lightFolder.add(this.renderer, 'gammaOutput').onChange(() => {
            traverseMaterials(this.content, (material) => {
                material.needsUpdate = true;
            });
        });
        const envMapCtrl = lightFolder.add(this.state, 'environment', environments.map(env => env.name));
        envMapCtrl.onChange(() => this.updateEnvironment());
        [
            lightFolder.add(this.state, 'exposure', 0, 2),
            lightFolder.add(this.state, 'addLights').listen(),
            lightFolder.add(this.state, 'ambientIntensity', 0, 2),
            lightFolder.addColor(this.state, 'ambientColor'),
            lightFolder.add(this.state, 'directIntensity', 0, 4), // TODO(#116)
            lightFolder.addColor(this.state, 'directColor'),
        ].forEach(ctrl => ctrl.onChange(() => this.updateLights()));

        // Animation controls.
        this.animFolder = gui.addFolder('Animation');
        this.animFolder.domElement.style.display = 'none';
        const playbackSpeedCtrl = this.animFolder.add(this.state, 'playbackSpeed', 0, 1);
        playbackSpeedCtrl.onChange((speed) => {
            if (this.mixer) this.mixer.timeScale = speed;
        });
        this.animFolder.add({ playAll: () => this.playAllClips() }, 'playAll');

        // Morph target controls.
        this.morphFolder = gui.addFolder('Morph Targets');
        this.morphFolder.domElement.style.display = 'none';

        // Camera controls.
        this.cameraFolder = gui.addFolder('Cameras');
        this.cameraFolder.domElement.style.display = 'none';

        // Stats.
        const perfFolder = gui.addFolder('Performance');
        const perfLi = document.createElement('li');
        this.stats.dom.style.position = 'static';
        perfLi.appendChild(this.stats.dom);
        perfLi.classList.add('gui-stats');
        perfFolder.__ul.appendChild(perfLi);

        const guiWrap = document.createElement('div');
        this.el.appendChild(guiWrap);
        guiWrap.classList.add('gui-wrap');
        guiWrap.appendChild(gui.domElement);
        gui.open();
    }

    updateToneMapping() {
        renderer.toneMapping = this.state.toneMapping;
        traverseMaterials(this.content, (material) => {
            material.needsUpdate = true;
        });
    }

    updateGUI() {
        this.cameraFolder.domElement.style.display = 'none';

        this.morphCtrls.forEach(ctrl => ctrl.remove());
        this.morphCtrls.length = 0;
        this.morphFolder.domElement.style.display = 'none';

        this.animCtrls.forEach(ctrl => ctrl.remove());
        this.animCtrls.length = 0;
        this.animFolder.domElement.style.display = 'none';

        const cameraNames = [];
        const morphMeshes = [];
        this.content.traverse((node) => {
            if (node.isMesh && node.morphTargetInfluences) {
                morphMeshes.push(node);
            }
            if (node.isCamera) {
                node.name = node.name || `VIEWER__camera_${cameraNames.length + 1}`;
                cameraNames.push(node.name);
            }
        });

        if (cameraNames.length) {
            this.cameraFolder.domElement.style.display = '';
            if (this.cameraCtrl) this.cameraCtrl.remove();
            const cameraOptions = [DEFAULT_CAMERA].concat(cameraNames);
            this.cameraCtrl = this.cameraFolder.add(this.state, 'camera', cameraOptions);
            this.cameraCtrl.onChange(name => this.setCamera(name));
        }

        if (morphMeshes.length) {
            this.morphFolder.domElement.style.display = '';
            morphMeshes.forEach((mesh) => {
                if (mesh.morphTargetInfluences.length) {
                    const nameCtrl = this.morphFolder.add({ name: mesh.name || 'Untitled' }, 'name');
                    this.morphCtrls.push(nameCtrl);
                }
                for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                    const ctrl = this.morphFolder.add(mesh.morphTargetInfluences, i, 0, 1, 0.01).listen();
                    Object.keys(mesh.morphTargetDictionary).forEach((key) => {
                        if (key && mesh.morphTargetDictionary[key] === i) ctrl.name(key);
                    });
                    this.morphCtrls.push(ctrl);
                }
            });
        }

        if (this.clips.length) {
            this.animFolder.domElement.style.display = '';
            const actionStates = this.state.actionStates = {};
            this.clips.forEach((clip, clipIndex) => {
                // Autoplay the first clip.
                let action;
                if (clipIndex === 0) {
                    actionStates[clip.name] = false;
                    action = this.mixer.clipAction(clip);
                    // action.play();
                } else {
                    actionStates[clip.name] = false;
                }

                clip.setActive = (active) => {
                    action = action || this.mixer.clipAction(clip);
                    action.setEffectiveTimeScale(1);
                    if (active) {
                        // action.paused = false;
                        action.play();
                    } else {
                        action.stop();
                    }
                };

                // Play other clips when enabled.
                const ctrl = this.animFolder.add(actionStates, clip.name).listen();
                ctrl.onChange((playAnimation) => {
                    this.clips.setActive(playAnimation);
                });
                this.animCtrls.push(ctrl);
            });
        }
    }

    clear() {
        if (!this.content) return;

        this.scene.remove(this.content);

        this.actions = {};

        // govie addon: do not dispose the object, just hide it

        // this.content.visible = false;
        // dispose geometry
        /*
        this.content.traverse((node) => {
            if (!node.isMesh) return;

            node.geometry.dispose();
        });

        // dispose textures
        traverseMaterials(this.content, (material) => {
            MAP_NAMES.forEach((map) => {
                if (material[map]) material[map].dispose();
            });
        });
        */
    }
};

function traverseMaterials(object, callback) {
    if (!object) return;
    object.traverse((node) => {
        if (!node.isMesh) return;
        const materials = Array.isArray(node.material) ?
            node.material : [node.material];
        materials.forEach(callback);
    });
}