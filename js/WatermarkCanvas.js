const canvasUtils = (() => {
    const isSupported = {
        canvas: !!document.createElement("canvas").getContext,
        imageData: !!CanvasRenderingContext2D.prototype.getImageData,
        dataURL: !!HTMLCanvasElement.prototype.toDataURL,
        btoa: !!window.btoa,
    };

    if (!isSupported.canvas || !isSupported.dataURL || !isSupported.btoa) {
        throw new Error("Canvas, DataURL, or btoa not supported");
    };

    const scaleCanvas = (canvas, width = canvas.width, height = canvas.height) => {
        const scaledCanvas = document.createElement("canvas");
        Object.assign(scaledCanvas, { width, height });
        const context = scaledCanvas.getContext("2d");
        context.drawImage(canvas, 0, 0, width, height);
        return scaledCanvas;
    };

    const getDataURL = (canvas, type, width, height) => {
        const scaledCanvas = scaleCanvas(canvas, width, height);
        return scaledCanvas.toDataURL(type);
    };

    const saveFile = (dataURL, filename) => {
        const aLink = document.createElement("a");
        Object.assign(aLink, { download: filename, href: dataURL });
        document.body.appendChild(aLink);
        aLink.click();
        document.body.removeChild(aLink);
    };

    const fixType = (type) => `image/${type.toLowerCase().replace(/jpg/i, "jpeg")}`;

    const encodeData = (data) => {
        if (typeof data === "string") {
            return window.btoa(data);
        } else {
            const uint8Array = new Uint8Array(data);
            const binaryString = uint8Array.reduce((str, byte) => str + String.fromCharCode(byte), '');
            return window.btoa(binaryString);
        }
    };

    const getImageData = (canvas) => {
        const context = canvas.getContext("2d");
        return context.getImageData(0, 0, canvas.width, canvas.height);
    };

    const genBitmapImage = (oData) => {
        const biWidth = oData.width;
        const biHeight = oData.height;
        const biSizeImage = biWidth * biHeight * 3;
        const bfSize = biSizeImage + 54;

        const BITMAPFILEHEADER = [
            0x42, 0x4d,
            bfSize & 0xff, (bfSize >> 8) & 0xff, (bfSize >> 16) & 0xff, (bfSize >> 24) & 0xff,
            0, 0,
            0, 0,
            54, 0, 0, 0
        ];

        const BITMAPINFOHEADER = [
            40, 0, 0, 0,
            biWidth & 0xff, (biWidth >> 8) & 0xff, (biWidth >> 16) & 0xff, (biWidth >> 24) & 0xff,
            biHeight & 0xff, (biHeight >> 8) & 0xff, (biHeight >> 16) & 0xff, (biHeight >> 24) & 0xff,
            1, 0,
            24, 0,
            0, 0, 0, 0,
            biSizeImage & 0xff, (biSizeImage >> 8) & 0xff, (biSizeImage >> 16) & 0xff, (biSizeImage >> 24) & 0xff,
            0, 0, 0, 0,
            0, 0, 0, 0
        ];

        const aImgData = oData.data;
        const strPixelData = [];
        const padding = (4 - (biWidth * 3 % 4)) % 4;

        for (let y = biHeight - 1; y >= 0; y--) {
            for (let x = 0; x < biWidth; x++) {
                const i = (x + y * biWidth) * 4;
                const strPixelRow = [aImgData[i + 2], aImgData[i + 1], aImgData[i]];
                strPixelData.push(...strPixelRow);
            }
            for (let p = 0; p < padding; p++) {
                strPixelData.push(0);
            }
        }

        const strEncoded = encodeData(BITMAPFILEHEADER.concat(BITMAPINFOHEADER)) + encodeData(strPixelData);

        return strEncoded;
    };

    const convertToImage = (canvas, width, height, type = "png") => {
        if (!isSupported.canvas || !isSupported.dataURL) {
            throw new Error("Canvas or DataURL not supported");
        }

        type = fixType(type);
        const data = type === "image/bmp"
            ? genBitmapImage(getImageData(scaleCanvas(canvas, width, height)))
            : getDataURL(canvas, type, width, height);

        const img = new Image();
        img.src = data;
        return img;
    };

    const saveAsImage = (canvas, width, height, type = "png") => {
        const fixedType = fixType(type);
        const filename = `image.${fixedType.split('/')[1]}`;
        const data = fixedType === "image/bmp"
            ? genBitmapImage(getImageData(scaleCanvas(canvas, width, height)))
            : getDataURL(canvas, fixedType, width, height);

        saveFile(data, filename);
    };

    return {
        saveAsImage,
        saveAsPNG: (canvas, width, height) => saveAsImage(canvas, width, height, "png"),
        saveAsJPEG: (canvas, width, height) => saveAsImage(canvas, width, height, "jpeg"),
        saveAsGIF: (canvas, width, height) => saveAsImage(canvas, width, height, "gif"),
        saveAsBMP: (canvas, width, height) => saveAsImage(canvas, width, height, "bmp"),
        convertToImage,
        convertToPNG: (canvas, width, height) => convertToImage(canvas, width, height, "png"),
        convertToJPEG: (canvas, width, height) => convertToImage(canvas, width, height, "jpeg"),
        convertToGIF: (canvas, width, height) => convertToImage(canvas, width, height, "gif"),
        convertToBMP: (canvas, width, height) => convertToImage(canvas, width, height, "bmp"),
    };
})();

const canvasTextAutoLine = (ctx, width, str, initX, initY, lineHeight = 20) => {
    let lineWidth = 0;
    let lastSubStrIndex = 0;

    for (let i = 0; i < str.length; i++) {
        lineWidth += ctx.measureText(str[i]).width;

        if (lineWidth > width - initX) {
            ctx.fillText(str.substring(lastSubStrIndex, i), initX, initY);
            initY += lineHeight;
            lineWidth = 0;
            lastSubStrIndex = i;
        }

        if (i === str.length - 1) {
            ctx.fillText(str.substring(lastSubStrIndex, i + 1), initX, initY);
        }
    }
};

const hexToRgb = (hex) => {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return match ? `${parseInt(match[1], 16)}, ${parseInt(match[2], 16)}, ${parseInt(match[3], 16)}` : null;
};

const rgbToHex = (r, g, b) => `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;

class Watermark {
    constructor(canvas, opt = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.cw = document.createElement("canvas");

        this.img = null;
        this.imgWidth = 0;
        this.imgHeight = 0;
        this.step = 0;

        this.userOptions = opt;
        this.originalOptions = { ...opt };

        this.initialSettings = {
            fontSize: opt.fontSize,
            watermarkWidth: opt.watermarkWidth,
            watermarkHeight: opt.watermarkHeight,
            fillStyle: opt.fillStyle,
            direction: opt.direction,
            opacity: opt.opacity
        };

        this.createWatermarkCanvas();
    }

    createWatermarkCanvas() {
        const { text, fontSize, fillStyle, watermarkWidth, watermarkHeight, direction } = this.userOptions;
        const wctx = this.cw.getContext("2d");
        this.cw.width = watermarkWidth;
        this.cw.height = watermarkHeight;

        wctx.font = `${fontSize}px Microsoft YaHei, SimSun, sans-serif`;
        wctx.fillStyle = fillStyle;

        this.drawWatermark(wctx, text, fontSize, watermarkWidth, watermarkHeight, direction);
    }

    drawWatermark(wctx, text, fontSize, width, height, direction) {
        switch (direction) {
            case 'vertical':
                wctx.rotate(-90 * Math.PI / 180);
                canvasTextAutoLine(wctx, height, text, 10 - height, fontSize + 20, fontSize * 1.4);
                break;
            case 'diagonal':
                const rotate = 20;
                wctx.rotate(-rotate * Math.PI / 180);
                const Y = Math.sin(rotate * Math.PI / 180) * width;
                const X = -Y / Math.tan((90 - rotate) * Math.PI / 180);
                canvasTextAutoLine(wctx, width, text, X + 10, Y + fontSize + 20, fontSize * 1.4);
                break;
            case 'horizontal':
            default:
                canvasTextAutoLine(wctx, width, text, 10, fontSize + 20, fontSize * 1.4);
        }
    }

    drawImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const rotations = [0, 90, 180, 270];
        const rotation = rotations[this.step] * Math.PI / 180;
        const { width, height } = this.img;
        const [newWidth, newHeight] = this.step % 2 === 0 ? [width, height] : [height, width];

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.ctx.save();
        this.ctx.translate(newWidth / 2, newHeight / 2);
        this.ctx.rotate(rotation);
        this.ctx.drawImage(this.img, -width / 2, -height / 2, width, height);
        this.ctx.restore();
    }

    addWatermark() {
        const pat = this.ctx.createPattern(this.cw, "repeat");
        this.ctx.fillStyle = pat;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    _draw() {
        this.drawImage();
        this.addWatermark();
    }

    draw(dataURL) {
        this.step = 0;
        this.img = new Image();
        this.img.onload = () => {
            this.imgWidth = this.img.width;
            this.imgHeight = this.img.height;

            this.adjustWatermarkSize();

            this.createWatermarkCanvas();
            this._draw();
        };
        this.img.src = dataURL;
    }

    adjustWatermarkSize() {
        const scalingFactor = Math.max(this.imgWidth, this.imgHeight) / 1000;
        const newFontSize = Math.max(this.originalOptions.fontSize, this.initialSettings.fontSize * scalingFactor);
        const newWidth = Math.max(this.originalOptions.watermarkWidth, this.initialSettings.watermarkWidth * scalingFactor);
        const newHeight = Math.max(this.originalOptions.watermarkHeight, this.initialSettings.watermarkHeight * scalingFactor);

        this.userOptions.fontSize = newFontSize;
        this.userOptions.watermarkWidth = newWidth;
        this.userOptions.watermarkHeight = newHeight;

        this.updateHtmlSettings();
    }

    rotate() {
        if (!this.img) return;
        this.step = (this.step + 1) % 4;
        this._draw();
    }

    save() {
        if (!this.img) return;
        canvasUtils.saveAsPNG(this.canvas);
    }

    setOptions(obj = {}) {
        this.userOptions = { ...this.userOptions, ...obj };
        this.createWatermarkCanvas();
        if (this.img) this._draw();
    }

    updateHtmlSettings() {
        document.getElementById('fontSize').value = Math.round(this.userOptions.fontSize);
        document.getElementById('watermarkWidth').value = Math.round(this.userOptions.watermarkWidth);
        document.getElementById('watermarkHeight').value = Math.round(this.userOptions.watermarkHeight);
        document.getElementById('fontColor').value = rgbToHex(this.userOptions.fillStyle);
        document.getElementById('direction').value = this.userOptions.direction;
        document.getElementById('opacity').value = this.userOptions.opacity;
        document.querySelector('.range-value').textContent = `${this.userOptions.opacity} %`;
    }
}

export { Watermark, hexToRgb };  