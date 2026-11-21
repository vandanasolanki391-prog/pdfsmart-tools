/* Shared drag-and-drop upload support for PDFSmart Tools. */
(function () {
  "use strict";

  function findDropZone(input) {
    if (input.id) {
      const byData = document.querySelector('.upload-area[data-input="' + CSS.escape(input.id) + '"]');
      if (byData) return byData;
      const label = document.querySelector('label[for="' + CSS.escape(input.id) + '"]');
      if (label) return label;
    }
    return input.closest('.upload-area, .upload-btn, .converter-form form');
  }

  function setFiles(input, files) {
    if (!files || !files.length) return;
    try {
      const transfer = new DataTransfer();
      Array.from(files).forEach(file => transfer.items.add(file));
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      console.warn('Drag-and-drop upload could not be applied in this browser.', error);
    }
  }

  document.querySelectorAll('input[type="file"]').forEach(input => {
    const zone = findDropZone(input);
    if (!zone || zone.dataset.dropReady === 'true') return;
    zone.dataset.dropReady = 'true';
    zone.classList.add('file-drop-zone');

    // Native labels already open their associated file picker; custom div zones need this.
    if (zone.matches('.upload-area[data-input]')) {
      zone.addEventListener('click', event => {
        if (event.target.closest('button, a, input, label')) return;
        input.click();
      });
    }

    ['dragenter', 'dragover'].forEach(type => zone.addEventListener(type, event => {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.add('file-drag-active');
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    }));

    ['dragleave', 'dragend'].forEach(type => zone.addEventListener(type, event => {
      if (type === 'dragleave' && event.relatedTarget && zone.contains(event.relatedTarget)) return;
      zone.classList.remove('file-drag-active');
    }));

    zone.addEventListener('drop', event => {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.remove('file-drag-active');
      setFiles(input, event.dataTransfer && event.dataTransfer.files);
    });
  });
})();
