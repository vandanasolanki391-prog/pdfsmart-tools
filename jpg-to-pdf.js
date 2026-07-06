const imageFilesInput = document.getElementById("imageFiles");
const uploadSection = document.getElementById("uploadSection");
const workSection = document.getElementById("workSection");
const dropArea = document.getElementById("dropArea");

const imageList = document.getElementById("imageList");
const convertBtn = document.getElementById("convertBtn");
const statusText = document.getElementById("statusText");

const pageSizeSelect = document.getElementById("pageSize");
const orientationSelect = document.getElementById("orientation");
const marginSizeSelect = document.getElementById("marginSize");

let selectedImages = [];
let dragIndex = null;

/* ===========================
   FILE SELECT
=========================== */

imageFilesInput.addEventListener("change", function(e){

    addImages(Array.from(e.target.files));

    imageFilesInput.value = "";

});

/* ===========================
   DRAG & DROP UPLOAD
=========================== */

["dragenter","dragover"].forEach(eventName=>{

    dropArea.addEventListener(eventName,function(e){

        e.preventDefault();
        e.stopPropagation();

        dropArea.classList.add("dragover");

    });

});

["dragleave","drop"].forEach(eventName=>{

    dropArea.addEventListener(eventName,function(e){

        e.preventDefault();
        e.stopPropagation();

        dropArea.classList.remove("dragover");

    });

});

dropArea.addEventListener("drop",function(e){

    const files=Array.from(e.dataTransfer.files).filter(file=>

        file.type==="image/jpeg" ||
        file.type==="image/jpg" ||
        file.type==="image/png"

    );

    addImages(files);

});

/* ===========================
   COMMON FUNCTION
=========================== */

function addImages(files){

    if(files.length===0) return;

    selectedImages=selectedImages.concat(files);

    uploadSection.style.display="none";
    workSection.style.display="block";

    renderImageList();

}
