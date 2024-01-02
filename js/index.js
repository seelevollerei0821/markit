import { Watermark, hexToRgb } from "./WatermarkCanvas.js";

document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    const copyrightYearElement = document.getElementById('copyright-year');
    copyrightYearElement.textContent = currentYear;

    const getDefaultOptions = () => ({
        text: "stares.com.tw",
        fontSize: 16,
        fillStyle: "rgba(100, 100, 100, 0.4)",
        watermarkWidth: 200,
        watermarkHeight: 100,
        direction: 'horizontal',
        opacity: 40
    });

    const getElement = (id) => document.getElementById(id);
    const getClass = (className) => document.querySelector(className);

    const canvas = getElement('myCanvas');
    const watermarkInstance = new Watermark(canvas, getDefaultOptions());
    const imageLoader = getElement('imageLoader');
    const rotateBtn = getElement('rotateBtn');
    const saveBtn = getElement('saveBtn');
    const opacityInput = getElement('opacity');
    const opacityValueDisplay = getClass('.range-value');
    const toggleSettingsBtn = getElement('toggleSettingsBtn');
    const settingsPanel = getClass('.settings-panel');
    const navbarA = getClass('.navbar a');
    const navbar = getClass('.navbar');
    const saveFormat = getElement('saveFormat');

    toggleSettingsBtn.addEventListener('click', () => {
        const isActive = settingsPanel.classList.toggle('active');
        toggleSettingsBtn.innerText = isActive ? '收起設置' : '水印設置';
        navbarA.classList.toggle('active', isActive);
        navbar.classList.toggle('active', isActive);
    });

    let currentImageUrl = null;

    imageLoader.addEventListener('change', (e) => {
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
    const debouncedApplySettings = debounce(applySettings, 300);

    settingsInputs.forEach((input) => {
        input.addEventListener('input', debouncedApplySettings);
    });

    settingsSelects.forEach((select) => {
        select.addEventListener('change', debouncedApplySettings);
    });

    opacityInput.addEventListener('input', () => {
        opacityValueDisplay.textContent = `${opacityInput.value}%`;
    });

    function applySettings() {
        const watermarkText = getElement('watermarkText').value || getDefaultOptions().text;
        const fontSize = parseInt(getElement('fontSize').value, 10) || getDefaultOptions().fontSize;
        const fontColor = getElement('fontColor').value || getDefaultOptions().fillStyle;
        const opacityValue = parseFloat(opacityInput.value) / 100 || getDefaultOptions().opacity / 100;
        const watermarkWidth = parseInt(getElement('watermarkWidth').value, 10) || getDefaultOptions().watermarkWidth;
        const watermarkHeight = parseInt(getElement('watermarkHeight').value, 10) || getDefaultOptions().watermarkHeight;
        const direction = getElement('direction').value || getDefaultOptions().direction;

        watermarkInstance.setOptions({
            text: watermarkText,
            fontSize,
            fillStyle: `rgba(${hexToRgb(fontColor)}, ${opacityValue})`,
            watermarkWidth,
            watermarkHeight,
            direction,
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