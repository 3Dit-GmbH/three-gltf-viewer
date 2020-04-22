/* forwarding events from playcanvas to govie player logic */

export const setupEventEmitter = () => {
    if (window.GovieEventEmitter) { return; }

    const attributeHandler = [];
    const callAttributeHandler = (id, value) => {
        attributeHandler.forEach((handler) => {
            handler(id, value);
        });
    };

    const actionHandler = [];
    const callActionHandler = (id, value) => {
        actionHandler.forEach((handler) => {
            handler(id, value);
        });
    };


    window.GovieEventEmitter = {
        registerAttributeSetHandler: (handler) => {
            attributeHandler.push(handler);
        },
        registerActionCallHandler: (handler) => {
            actionHandler.push(handler);
        },
        emit: () => {
            console.warn('USING GOVIE EMIT EVENT THATS NOT CONNECTED YET');
        },
        callAttributeHandler,
        callActionHandler,
    };

    window.GovieEventEmitter.emit = (...args) => {
        window.parent.postMessage({
            type: 'emit',
            args,
        }, '*');
    };

    const receiveMessage = (e) => {
        if (e.data.type === 'set-attribute') {
            callAttributeHandler(e.data.id, e.data.value);
        }
        if (e.data.type === 'call-action') {
            callActionHandler(e.data.id, e.data.value);
        }
    };

    window.addEventListener('message', receiveMessage);
};
