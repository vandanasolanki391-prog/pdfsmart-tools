document.querySelectorAll(".upload-area").forEach(uploadArea => {

    const inputId = uploadArea.dataset.input;
    const fileInput = document.getElementById(inputId);

    if(!fileInput) return;

    uploadArea.addEventListener("click", () => {
        fileInput.click();
    });

    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");

        const files = e.dataTransfer.files;

        if(files.length > 0){
            fileInput.files = files;

            const event = new Event("change", {
                bubbles: true
            });

            fileInput.dispatchEvent(event);
        }
    });
});
