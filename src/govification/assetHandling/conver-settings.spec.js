import expect from 'expect.js';
import {
    readAttributeSettings, writeAttributeSettings,
} from './convert-settings';
import { getVersionAttribute } from '../util/handle-attribute';
import { CustomPropertyNames } from '../util/constants';

describe('readAttributeSettings(attrSettings[])', () => {
    it('is a function', () => {
        const actual = typeof readAttributeSettings;
        const expected = 'function';
        expect(actual).equal(expected);
    });

    it('returns an object', () => {
        const actual = typeof readAttributeSettings();
        const expected = 'object';
        expect(actual).equal(expected);
    });

    it(`returns an object with 'animationStates' 
        based on passed animation enum-attributes`,
    () => {
        const animationAttributes = [
            { id: 'animation-state:anim1', defaultValue: '0' },
            { id: 'animation-state:anim2', defaultValue: '0' },
            { id: 'animation-state:anim3', defaultValue: '0' },
        ];

        const actual = readAttributeSettings(animationAttributes).animationStates;
        const expected = [
            {
                name: 'anim1',
            }, {
                name: 'anim2',
            }, {
                name: 'anim3',
            }];
        expect(actual).eql(expected);
    });

    it(`adds a 'loop' flag to an animationState ' 
        if the connected attributes is set to be looped`,
    () => {
        const animationAttributes = [
            { id: 'animation-state:anim1', defaultValue: '0' },
            { id: 'animation-state:anim2', defaultValue: '2' },
            { id: 'animation-state:anim3', defaultValue: '2' },
        ];

        const actual = readAttributeSettings(animationAttributes).animationStates;
        const expected = [
            {
                name: 'anim1',
            }, {
                name: 'anim2',
                loop: true,
            }, {
                name: 'anim3',
                loop: true,
            }];
        expect(actual).eql(expected);
    });

    it(`adds 0 as 'pauseAt' time to an animationState ' 
        if the connected attributes is set to be paused without a certain pausedAt time attribute `,
    () => {
        const animationAttributes = [
            { id: 'animation-state:anim1', defaultValue: '0' },
            { id: 'animation-state:anim2', defaultValue: '1' },
            { id: 'animation-state:anim3', defaultValue: '2' },
        ];

        const actual = readAttributeSettings(animationAttributes).animationStates;
        const expected = [
            {
                name: 'anim1',
            }, {
                name: 'anim2',
                pauseAt: 0,
            }, {
                name: 'anim3',
                loop: true,
            }];
        expect(actual).eql(expected);
    });

    it(`adds the certain time to 'pausedAt' to an animationState ' 
        if the connected attributes is set to be paused and has certain pausedAt time attribute `,
    () => {
        const animationAttributes = [
            { id: 'animation-state:anim1', defaultValue: '0' },
            { id: 'animation-state:anim2', defaultValue: '1' },
            { id: 'animation-pauseAt:anim2', defaultValue: 0.5 },
            { id: 'animation-state:anim3', defaultValue: '2' },
        ];

        const actual = readAttributeSettings(animationAttributes).animationStates;
        const expected = [
            {
                name: 'anim1',
            }, {
                name: 'anim2',
                pauseAt: 0.5,
            }, {
                name: 'anim3',
                loop: true,
            }];
        expect(actual).eql(expected);
    });

    it('adds a list of custom property visibility for each visibility boolean-attribute', () => {
        const visibilityPropertyAttributes = [
            { id: 'visibility-state:obj1', defaultValue: true, title: 'Object 1' },
            { id: 'visibility-state:obj2', defaultValue: true, title: 'Object 2' },
            { id: 'visibility-state:obj3', defaultValue: false, title: 'Object 3' },
        ];


        const actual = readAttributeSettings(visibilityPropertyAttributes).customPropertyStates;
        const expected = [
            {
                id: 'obj1',
                propertyValue: 1,
                objectName: 'Object 1',
                propertyName: 'visibility',
            }, {
                id: 'obj2',
                propertyValue: 1,
                objectName: 'Object 2',
                propertyName: 'visibility',
            }, {
                id: 'obj3',
                propertyValue: 0,
                objectName: 'Object 3',
                propertyName: 'visibility',
            }];
        expect(actual).eql(expected);
    });
});

describe('writeAttributeSettings(modelSettings{})', () => {
    it('is a function', () => {
        const actual = typeof writeAttributeSettings;
        const expected = 'function';
        expect(actual).equal(expected);
    });

    it('returns an array', () => {
        const actual = writeAttributeSettings();
        expect(Array.isArray(actual)).be.ok();
    });

    it('returns an array of animation enum-attributes',
        () => {
            const animationAttributes = [
                getVersionAttribute(1),
                {
                    id: 'animation-state:anim1',
                    type: 'enum',
                    data: {
                        0: 'Stoppen',
                        1: 'Pausieren Bei',
                        2: 'Abspielen',
                    },
                    defaultValue: '0',
                    title: 'anim1',
                    subTitle: '',
                },
                {
                    id: 'animation-state:anim2',
                    type: 'enum',
                    data: {
                        0: 'Stoppen',
                        1: 'Pausieren Bei',
                        2: 'Abspielen',
                    },
                    defaultValue: '1',
                    title: 'anim2',
                    subTitle: '',
                },
                {
                    id: 'animation-pauseAt:anim2',
                    type: 'float',
                    defaultValue: 0.5,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    title: '',
                    subTitle: '',
                },
                {
                    id: 'animation-state:anim3',
                    type: 'enum',
                    data: {
                        0: 'Stoppen',
                        1: 'Pausieren Bei',
                        2: 'Abspielen',
                    },
                    defaultValue: '2',
                    title: 'anim3',
                    subTitle: '',
                },
            ];

            const modelSettings = {
                animationStates: [{
                    name: 'anim1',
                }, {
                    name: 'anim2',
                    pauseAt: 0.5,
                }, {
                    name: 'anim3',
                    loop: true,
                }],
            };

            const actual = writeAttributeSettings(modelSettings);
            const expected = animationAttributes;
            expect(actual).eql(expected);
        });

    it('shortens animation names to 20 chars', () => {
        const animationAttributes = [
            getVersionAttribute(1),
            {
                id: 'animation-state:this.is.a.shorten.title.yeah!',
                type: 'enum',
                data: {
                    0: 'Stoppen',
                    1: 'Pausieren Bei',
                    2: 'Abspielen',
                },
                defaultValue: '0',
                title: 'this.is.a.shorten.ti...',
                subTitle: '',
            },
        ];

        const modelSettings = {
            animationStates: [{
                name: 'this.is.a.shorten.title.yeah!',
            }],
        };

        const actual = writeAttributeSettings(modelSettings);
        const expected = animationAttributes;
        expect(actual).eql(expected);
    });

    it('returns a boolean array for each visibility custom property',
        () => {
            const visibilitySettings = {
                customPropertyStates: [
                    {
                        id: 'visibility-obj1',
                        objectName: 'Object 1',
                        propertyName: CustomPropertyNames.visibility,
                        propertyValue: 1,
                    },
                    {
                        id: 'visibility-obj2',
                        objectName: 'Object 2',
                        propertyName: CustomPropertyNames.visibility,
                        propertyValue: 0,
                    },
                    {
                        id: 'visibility-obj3',
                        objectName: 'Object 3',
                        propertyName: CustomPropertyNames.visibility,
                        propertyValue: 0,
                    },
                ],
            };

            const visibilityAttributes = [
                getVersionAttribute(1),
                {
                    id: 'visibility-state:visibility-obj1',
                    type: 'boolean',
                    defaultValue: true,
                    title: 'Object 1',
                    subTitle: '',
                },
                {
                    id: 'visibility-state:visibility-obj2',
                    type: 'boolean',
                    defaultValue: false,
                    title: 'Object 2',
                    subTitle: '',
                },
                {
                    id: 'visibility-state:visibility-obj3',
                    type: 'boolean',
                    defaultValue: false,
                    title: 'Object 3',
                    subTitle: '',
                },
            ];

            const actual = writeAttributeSettings(visibilitySettings);
            const expected = visibilityAttributes;
            expect(actual).eql(expected);
        });
});
