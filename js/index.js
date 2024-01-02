import { Watermark, hexToRgb } from "./WatermarkCanvas.js";

document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    document.getElementById('copyright-year').textContent = currentYear;

    const getDefaultOptions = () => {
        return {
            text: "stares.com.tw",
            fontSize: 16,
            fillStyle: "rgba(100, 100, 100, 0.4)",
            watermarkWidth: 200,
            watermarkHeight: 100,
            direction: 'horizontal',
            opacity: 40
        };
    };

    const canvas = document.getElementById('myCanvas');
    const watermarkInstance = new Watermark(canvas, getDefaultOptions());
    const imageLoader = document.getElementById('imageLoader');
    const rotateBtn = document.getElementById('rotateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const opacityInput = document.getElementById('opacity');
    const opacityValueDisplay = document.querySelector('.range-value');
    const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
    const settingsPanel = document.querySelector('.settings-panel');
    const navbarA = document.querySelector('.navbar a');
    const navbar = document.querySelector('.navbar');
    const saveFormat = document.getElementById('saveFormat');

    toggleSettingsBtn.addEventListener('click', () => {
        const isActive = settingsPanel.classList.toggle('active');
        toggleSettingsBtn.innerText = isActive ? '收起設置' : '水印設置';
        navbarA.classList.toggle('active', isActive);
        navbar.classList.toggle('active', isActive);
    });

    let currentImageUrl = null;

    imageLoader.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            if (currentImageUrl) {
                URL.revokeObjectURL(currentImageUrl);
                currentImageUrl = null;
            }
            currentImageUrl = URL.createObjectURL(file);
            watermarkInstance.draw(currentImageUrl);
        }
    });

    rotateBtn.addEventListener('click', () => watermarkInstance.rotate());
    saveBtn.addEventListener('click', () => watermarkInstance.save(saveFormat.value));

    const settingsInputs = document.querySelectorAll('.settings-panel input');
    const settingsSelects = document.querySelectorAll('.settings-panel select');

    settingsInputs.forEach(input => {
        input.addEventListener('input', debounce(applySettings, 300));
    });

    settingsSelects.forEach(select => {
        select.addEventListener('change', debounce(applySettings, 300));
    });

    opacityInput.addEventListener('input', function () {
        opacityValueDisplay.textContent = `${this.value}%`;
    });

    function applySettings() {
        const text = document.getElementById('watermarkText').value || getDefaultOptions().text;
        const fontSize = parseInt(document.getElementById('fontSize').value, 10) || getDefaultOptions().fontSize;
        const fillStyle = document.getElementById('fontColor').value || getDefaultOptions().fillStyle;
        const opacity = parseFloat(document.getElementById('opacity').value) / 100 || getDefaultOptions().opacity / 100;
        const watermarkWidth = parseInt(document.getElementById('watermarkWidth').value, 10) || getDefaultOptions().watermarkWidth;
        const watermarkHeight = parseInt(document.getElementById('watermarkHeight').value, 10) || getDefaultOptions().watermarkHeight;
        const direction = document.getElementById('direction').value || getDefaultOptions().direction;

        watermarkInstance.setOptions({
            text,
            fontSize,
            fillStyle: `rgba(${hexToRgb(fillStyle)}, ${opacity})`,
            watermarkWidth,
            watermarkHeight,
            direction
        });
    }

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
});