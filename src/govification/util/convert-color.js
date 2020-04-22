import rgba from 'rgba-convert';

const roundColor = col => ({
    r: parseInt(col.r, 10),
    g: parseInt(col.g, 10),
    b: parseInt(col.b, 10),
    a: parseInt(col.a, 10),
});

export const rgbToHex = (col) => {
    return rgba.hex(roundColor(col));
};

export const hexToRgb = (hex) => {
    return rgba.obj(hex);
};

export const decimalToRgb = (dec) => {
    return rgba.obj(dec);
};

export const rgbToDecimal = (col) => {
    return rgba.num(roundColor(col));
};
