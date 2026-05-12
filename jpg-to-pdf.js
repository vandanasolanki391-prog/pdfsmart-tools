const imageFilesInput = document.getElementById("imageFiles");
const imageList = document.getElementById("imageList");
const convertBtn = document.getElementById("convertBtn");
const statusText = document.getElementById("statusText");

const pageSizeSelect = document.getElementById("pageSize");
const orientationSelect = document.getElementById("orientation");
const marginSizeSelect = document.getElementById("marginSize");

let selectedImages = [];

/* SELECT IMAGES */

imageFilesInput.addEventListener("change", function(e){
    selectedImages = Array.from(e.target.files);
    renderImageList();
});

/* RENDER IMAGE LIST */

function renderImageList(){
    imageList.innerHTML = "";

    if(selectedImages.length === 0){
        statusText.innerText = "";
        return;
    }

    selectedImages.forEach((file, index) => {
        const imageUrl = URL.createObjectURL(file);

        const card = document.createElement("div");
        card.className = "image-card";

        card.innerHTML = `
            <img src="${imageUrl}" alt="Image Preview">

            <div class="image-name">
                ${index + 1}. ${file.name}
            </div>

            <div class="image-size">
                ${(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>

            <div class="image-actions">
                <button onclick="moveImageUp(${index})">↑</button>
                <button onclick="moveImageDown(${index})">↓</button>
                <button onclick="removeImage(${index})">Remove</button>
            </div>
        `;

        imageList.appendChild(card);
    });

    statusText.innerText =
        `${selectedImages.length} image(s) selected`;
}

/* ORDER CONTROLS */

function moveImageUp(index){
    if(index === 0) return;

    [selectedImages[index - 1], selectedImages[index]] =
    [selectedImages[index], selectedImages[index - 1]];

    renderImageList();
}

function moveImageDown(index){
    if(index === selectedImages.length - 1) return;

    [selectedImages[index + 1], selectedImages[index]] =
    [selectedImages[index], selectedImages[index + 1]];

    renderImageList();
}

function removeImage(index){
    selectedImages.splice(index, 1);
    renderImageList();
}

/* IMAGE LOAD HELPER */

function loadImage(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e){
            const img = new Image();

            img.onload = function(){
                resolve({
                    image: img,
                    dataUrl: e.target.result
                });
            };

            img.onerror = reject;
            img.src = e.target.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* CONVERT */

convertBtn.addEventListener("click", async function(){
    if(selectedImages.length === 0){
        alert("Please select at least one image.");
        return;
    }

    try{
        statusText.innerText =
            "Converting images to PDF... Please wait.";

        const pdfDoc =
            await PDFLib.PDFDocument.create();

        const pageSize = pageSizeSelect.value;
        const orientation = orientationSelect.value;
        const margin = parseInt(marginSizeSelect.value);

        for(const file of selectedImages){
            const loaded = await loadImage(file);

            let embeddedImage;

            if(
                file.type === "image/png" ||
                loaded.dataUrl.startsWith("data:image/png")
            ){
                embeddedImage =
                    await pdfDoc.embedPng(loaded.dataUrl);
            }
            else{
                embeddedImage =
                    await pdfDoc.embedJpg(loaded.dataUrl);
            }

            const imgWidth = loaded.image.width;
            const imgHeight = loaded.image.height;

            let pageWidth;
            let pageHeight;

            if(pageSize === "a4"){
                pageWidth = 595.28;
                pageHeight = 841.89;

                if(orientation === "landscape"){
                    pageWidth = 841.89;
                    pageHeight = 595.28;
                }
            }
            else{
                pageWidth = imgWidth;
                pageHeight = imgHeight;
            }

            const availableWidth = pageWidth - margin * 2;
            const availableHeight = pageHeight - margin * 2;

            const scale = Math.min(
                availableWidth / imgWidth,
                availableHeight / imgHeight
            );

            const drawWidth = imgWidth * scale;
            const drawHeight = imgHeight * scale;

            const x = (pageWidth - drawWidth) / 2;
            const y = (pageHeight - drawHeight) / 2;

            const page =
                pdfDoc.addPage([pageWidth, pageHeight]);

            page.drawImage(embeddedImage, {
                x: x,
                y: y,
                width: drawWidth,
                height: drawHeight
            });
        }

        const pdfBytes =
            await pdfDoc.save();

        const blob =
            new Blob(
                [pdfBytes],
                {type:"application/pdf"}
            );

        const link =
            document.createElement("a");

        link.href =
            URL.createObjectURL(blob);

        link.download =
            "jpg-to-pdf.pdf";

        link.click();

        statusText.innerText =
            "PDF created successfully.";
    }
    catch(error){
        console.error(error);

        statusText.innerText =
            "Error while converting images.";

        alert("Conversion failed. Please try again.");
    }
});
