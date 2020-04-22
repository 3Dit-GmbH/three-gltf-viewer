const blobToFile = (theBlob, fileName) => {
    const b = theBlob;
    b.lastModifiedDate = new Date();
    b.name = fileName;
    return b;
};

export const getFileObject = (url) => {
    let file;
    if (!navigator.msSaveBlob) {
        file = new File([''], url);
    } else {
        file = new Blob([''], { type: 'application/octet-stream' });
        file = blobToFile(file, url);
    }

    return file;
};
