const Loader = {};

const getHostUrl = (url) => {
    if(url.startsWith('file://'))
        return '*';
    const split = url.split('/');
    return split[0] + '//' + split[2];
};

(()=>{     
    const loadJSON = (path, cb) => {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', path, true); // Replace 'my_data' with the path to your file
        xobj.onreadystatechange = function () {
            if(xobj.readyState !== 4)
                return;
            if (xobj.status == "200") {
                // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
                cb(xobj.responseText);
                return;
            }
            cb('', new Error(`status ${xobj.status}, can\'t load manifest from: ${path}`)); 
        };
        xobj.send(null);
    };

    Loader.instantiate = (containerId, dataPath) => {
        
       //app specific code is in here
       let iframe = document.createElement('iframe');
       iframe.setAttribute('src',`${dataPath}/index.html`);
       iframe.id = 'interaction-container';
       iframe.style.width = "100%";
       iframe.style.height = "100%";
       iframe.style.position = "absolute";
       iframe.frameBorder = "0";       
       iframe.onload = () => {
           GovieEventEmitter.registerAttributeSetHandler((id, value) => {
               iframe.contentWindow.postMessage({
                   type:'set-attribute',
                   id,
                   value
               }, getHostUrl(dataPath));
           });

           GovieEventEmitter.registerActionCallHandler((id, value) => {
               iframe.contentWindow.postMessage({
                   type:'call-action',
                   id,
                   value
               }, getHostUrl(dataPath));
           });
       };   
       document.getElementById(containerId).appendChild(iframe);   
       document.body.style = "overflow:hidden;"
       const receiveMessage = (e) => {
           if(e.data.type === 'emit')
           {
               GovieEventEmitter.emit(...e.data.args);
           }
       }        
       window.addEventListener('message', receiveMessage);
    }    

    Loader.loadManifest = (dataPath) => {
        return new Promise((resolve, reject) => {
            loadJSON(`${dataPath}/manifest.json`, (content, error) => {
                if(error){
                    reject(error);
                    return;
                }
                resolve(JSON.parse(content));
            });
        });
    }

    document.Loader = Loader;
})();
