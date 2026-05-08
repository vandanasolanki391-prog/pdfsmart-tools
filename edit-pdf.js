document.addEventListener("DOMContentLoaded", function () {

    const pdfUpload = document.getElementById("pdfUpload");
    const previewBox = document.querySelector(".pdf-preview");

    pdfUpload.addEventListener("change", function () {

        const file = this.files[0];

        if(file){

            const fileURL = URL.createObjectURL(file);

            previewBox.innerHTML = `
                <iframe 
                    src="${fileURL}"
                    width="100%"
                    height="100%"
                    style="border:none; border-radius:12px;">
                </iframe>
            `;
        }

    });

});
