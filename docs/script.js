const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const convertButton = document.getElementById("convertButton");
const clearAllButton = document.getElementById("clearAllButton");
const imageTableContainer = document.getElementById("table-container");
const progressBar = document.getElementById("progressBar");
const imageTableBody = document.getElementById("imageTableBody");
const compressionSettings = document.getElementById("compressionSettings");
const compressionRange = document.getElementById("compressionRange");
const compressionValue = document.getElementById("compressionValue");

let uploadedFiles = []; // Track uploaded files

// Initially hide convert button, clearAll button, table, and progress bar
convertButton.style.display = "none";
clearAllButton.style.display = "none";
imageTableContainer.style.display = "none";
progressBar.style.display = "none";
compressionSettings.style.display = "none";

// Drag & Drop Events
dropArea.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropArea.classList.add("drag-over");
});

dropArea.addEventListener("dragleave", () => {
	dropArea.classList.remove("drag-over");
});

dropArea.addEventListener("drop", (e) => {
	e.preventDefault();
	dropArea.classList.remove("drag-over");
	handleFiles(e.dataTransfer.files);
});

// Handle file input
fileInput.addEventListener("change", (e) => {
	handleFiles(e.target.files);
});

// Handle dropped or selected files
function handleFiles(files) {
	Array.from(files).forEach((file) => {
		// Validate file type
		const validTypes = ["image/jpeg", "image/png"];
		if (!validTypes.includes(file.type)) {
			alert(`Invalid file type: ${file.name}. Only JPEG and PNG are supported.`);
			return;
		}

		// Validate file size (e.g., max 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			alert(`File too large: ${file.name}. Maximum size is 5MB.`);
			return;
		}

		// Add file to the table
		addFileToTable(file);
	});

	toggleUIVisibility(); // Show buttons and table after thumbnails are uploaded
}

function addFileToTable(file) {
	const row = document.createElement("tr");

	// Thumbnail cell
	const thumbnailCell = document.createElement("td");
	const img = document.createElement("img");
	img.src = URL.createObjectURL(file);
	img.alt = file.name;
	thumbnailCell.appendChild(img);

	// Filename cell
	const filenameCell = document.createElement("td");
	filenameCell.textContent = file.name;

	// Original size cell
	const originalSizeCell = document.createElement("td");
	originalSizeCell.textContent = formatSize(file.size);

	// Converted size cell (placeholder)
	const convertedSizeCell = document.createElement("td");
	convertedSizeCell.textContent = "Pending";

	// Compression cell (placeholder)
	const compressionCell = document.createElement("td");
	compressionCell.textContent = "Pending";

	// File type cell (placeholder)
	const fileTypeCell = document.createElement("td");
	const fileTypeSpan = document.createElement("span");
	fileTypeSpan.textContent = "WEBP";
	fileTypeSpan.classList.add("file-type"); // Add the class here
	fileTypeCell.appendChild(fileTypeSpan)

	// Download cell (placeholder)
	const downloadCell = document.createElement("td");
	const downloadButton = document.createElement("a");
	// downloadButton.textContent = "WEBP";
	// downloadButton.classList.add = "download-btn";
	downloadButton.href = "#";
	downloadButton.style.pointerEvents = "none"; // Disabled until converted
	downloadCell.appendChild(downloadButton);

	// Delete file cell
	const deleteCell = document.createElement("td");
	const deleteButton = document.createElement("button");
	deleteButton.textContent = "❌";
	deleteButton.className = "remove-btn";
	deleteButton.onclick = () => {
		removeImage(row, file);
	};
	deleteCell.appendChild(deleteButton);

	// Append all cells to row
	row.appendChild(thumbnailCell);
	row.appendChild(filenameCell);
	row.appendChild(originalSizeCell);
	row.appendChild(convertedSizeCell);
	row.appendChild(compressionCell);
	row.appendChild(fileTypeCell);
	row.appendChild(downloadCell);
	row.appendChild(deleteCell);

	// Append row to table
	imageTableBody.appendChild(row);

	// Add the file to the global uploadedFiles array
	uploadedFiles.push(file);

	toggleUIVisibility(); // Update visibility after adding a file
}

function removeImage(row, file) {
	// Remove the row from the table
	imageTableBody.removeChild(row);

	// Remove the file from the uploadedFiles array
	uploadedFiles = uploadedFiles.filter((f) => f !== file);

	toggleUIVisibility(); // Update visibility after removing a file
}

// Show or hide buttons and table based on the number of uploaded files
function toggleUIVisibility() {
	const hasFiles = uploadedFiles.length > 0;

	convertButton.style.display = hasFiles ? "inline-block" : "none";
	clearAllButton.style.display = hasFiles ? "inline-block" : "none";
	imageTableContainer.style.display = hasFiles ? "block" : "none";
	progressBar.style.display = hasFiles ? "block" : "none";
	compressionSettings.style.display = hasFiles ? "block" : "none";
}

// Clear all files
clearAllButton.addEventListener("click", () => {
	imageTableBody.innerHTML = ""; // Clear table
	uploadedFiles = []; // Clear array
	toggleUIVisibility(); // Update visibility
});

// Update progress bar
function updateProgress(percentage) {
	const progressFill = document.getElementById("progressFill");
	progressFill.style.width = `${percentage}%`;
}

// Update compression value
compressionRange.addEventListener("input", () => {
	compressionValue.textContent = compressionRange.value;
});

// Convert images to WebP
convertButton.addEventListener("click", async () => {
	const totalFiles = uploadedFiles.length;
	if (totalFiles === 0) return;

	for (let i = 0; i < totalFiles; i++) {
		const file = uploadedFiles[i];

		// Use browser-image-compression to compress and convert the file
		const options = {
			maxSizeMB: 1, // Maximum file size in MB
			maxWidthOrHeight: 1920, // Maximum dimensions
			useWebWorker: true, // Enable multi-threading
			fileType: "image/webp", // Convert to WebP format
			initialQuality: compressionRange.value / 100, // Compression quality
		};

		try {
			const compressedFile = await imageCompression(file, options);
			console.log("Compressed file:", compressedFile);

			// Update the table with the compressed file details
			const row = imageTableBody.rows[i];
			const convertedSizeCell = row.cells[3];
			convertedSizeCell.textContent = formatSize(compressedFile.size);

			const originalSizeCell = row.cells[2];
			const originalSize = parseFloat(originalSizeCell.textContent) * 1024; // Convert back to bytes
			const compressionPercent = ((1 - compressedFile.size / originalSize) * 100).toFixed(2);
			const compressionCell = row.cells[4];
			compressionCell.textContent = `-${compressionPercent}%`;

			const fileTypeCell = row.cells[5];
			const fileTypeSpan = document.createElement("span");
			fileTypeSpan.textContent = "WEBP";
			fileTypeSpan.classList.add("file-type"); // Add the class here
			// fileTypeCell.appendChild(fileTypeSpan)

			const downloadCell = row.cells[6];
			const downloadButton = document.createElement("a");
			downloadButton.href = URL.createObjectURL(compressedFile);
			downloadButton.download = `${file.name.split(".")[0]}.webp`;
			downloadButton.textContent = "Download";
			downloadButton.className = "download-btn";
			downloadButton.style.pointerEvents = "auto"; // Enable the button
			downloadCell.appendChild(downloadButton);

			// Update progress bar
			const progress = Math.round(((i + 1) / totalFiles) * 100);
			updateProgress(progress);
		} catch (error) {
			console.error("Error during conversion:", error);
		}
	}

	// Complete progress
	updateProgress(100);
	console.log("All files converted!");
});


// Format file size
function formatSize(size) {
	return `${(size / 1024).toFixed(2)} KB`;
}



// const dropArea = document.getElementById("dropArea");
// const fileInput = document.getElementById("fileInput");
// const convertButton = document.getElementById("convertButton");
// const clearAllButton = document.getElementById("clearAllButton");
// const imageTableContainer = document.getElementById("table-container");
// const progressBar = document.getElementById("progressBar");
// const imageTableBody = document.getElementById("imageTableBody");
// const compressionSettings = document.getElementById("compressionSettings");
// const compressionRange = document.getElementById("compressionRange");
// const compressionValue = document.getElementById("compressionValue");


// let uploadedFiles = []; // Track uploaded files

// // Initially hide upload button, clearAll button, table, and progress bar
// convertButton.style.display = "none";
// clearAllButton.style.display = "none";
// imageTableContainer.style.display = "none";
// progressBar.style.display = "none";
// compressionSettings.style.display = "none";

// // Drag & Drop Events
// dropArea.addEventListener("dragover", (e) => {
// 	e.preventDefault();
// 	dropArea.classList.add("drag-over");
// });

// dropArea.addEventListener("dragleave", () => {
// 	dropArea.classList.remove("drag-over");
// });

// dropArea.addEventListener("drop", (e) => {
// 	e.preventDefault();
// 	dropArea.classList.remove("drag-over");
// 	handleFiles(e.dataTransfer.files);
// });

// // Handle file input
// fileInput.addEventListener("change", (e) => {
// 	handleFiles(e.target.files);
// });

// // Handle dropped or selected files
// function handleFiles(files) {
// 	Array.from(files).forEach(async (file) => {
// 		// Validate file type
// 		const validTypes = ["image/jpeg", "image/png", "image/webp"];
// 		if (!validTypes.includes(file.type)) {
// 			alert(`Invalid file type: ${file.name}. Only JPEG, PNG, and WEBP are allowed.`);
// 			return;
// 		}

// 		// Validate file size (e.g., max 5MB)
// 		const maxSize = 5 * 1024 * 1024; // 5MB
// 		if (file.size > maxSize) {
// 			alert(`File too large: ${file.name}. Maximum size is 5MB.`);
// 			return;
// 		}

// 		// Upload the file directly to the server
// 		const isUploaded = await uploadFile(file);

// 		if (isUploaded) {
// 			addFileToTable(file); // Add file to table
// 		}
// 	});

// 	toggleUIVisibility(); // Show buttons and table after thumbnails are uploaded
// }

// // Upload a single file to the server
// async function uploadFile(file) {
// 	const formData = new FormData();
// 	formData.append("images", file);

// 	try {
// 		const response = await fetch("/uploads", {
// 			method: "POST",
// 			body: formData,
// 		});

// 		if (!response.ok) {
// 			console.error(`Failed to upload file: ${file.name}`);
// 			return false;
// 		}

// 		console.log(`File uploaded successfully: ${file.name}`);
// 		return true;
// 	} catch (error) {
// 		console.error(`Error uploading file: ${file.name}`, error);
// 		return false;
// 	}
// }

// function addFileToTable(file) {
// 	// Proceed with valid files
// 	const row = document.createElement("tr");

// 	// Thumbnail cell
// 	const thumbnailCell = document.createElement("td");
// 	const img = document.createElement("img");
// 	img.src = URL.createObjectURL(file);
// 	img.alt = file.name;
// 	thumbnailCell.appendChild(img);

// 	// Filename cell
// 	const filenameCell = document.createElement("td");
// 	filenameCell.textContent = file.name;

// 	// Original size cell
// 	const originalSizeCell = document.createElement("td");
// 	originalSizeCell.textContent = formatSize(file.size);

// 	// Converted size cell (placeholder)
// 	const convertedSizeCell = document.createElement("td");
// 	convertedSizeCell.textContent = "Pending";

// 	// Compression percentage cell (placeholder)
// 	const compressionCell = document.createElement("td");
// 	compressionCell.textContent = "Pending";

// 	// Download cell (placeholder)
// 	const downloadCell = document.createElement("td");
// 	const downloadButton = document.createElement("a");
// 	downloadButton.textContent = "WEBP";
// 	downloadButton.className = "download-btn";
// 	downloadButton.href = "#";
// 	downloadButton.style.pointerEvents = "none";
// 	downloadCell.appendChild(downloadButton);

// 	// Remove cell
// 	const removeCell = document.createElement("td");
// 	const removeButton = document.createElement("button");
// 	removeButton.textContent = "❌";
// 	removeButton.className = "remove-btn";
// 	removeButton.onclick = () => {
// 		removeImage(row, file);
// 	};
// 	removeCell.appendChild(removeButton);

// 	// Append all cells to row
// 	row.appendChild(thumbnailCell);
// 	row.appendChild(filenameCell);
// 	row.appendChild(originalSizeCell);
// 	row.appendChild(convertedSizeCell);
// 	row.appendChild(compressionCell);
// 	row.appendChild(downloadCell);
// 	row.appendChild(removeCell);

// 	// Append row to table
// 	imageTableBody.appendChild(row);

// 	// Add the file to the global uploadedFiles array
// 	uploadedFiles.push(file);

// 	// Enable buttons if there are uploaded files and show the table/progress bar
// 	toggleUIVisibility()

// 	// Update the file summary
// 	updateFileSummary();
// }

// // Remove an image
// function removeImage(row, file) {
// 	// Remove the row from the table
// 	imageTableBody.removeChild(row);

// 	// Remove the file from the uploadedFiles array
// 	uploadedFiles = uploadedFiles.filter((f) => f !== file);

// 	// Show buttons and table after thumbnails are uploaded
// 	toggleUIVisibility();

// 	updateFileSummary();
// }


// function updateProgress(percentage) {
// 	const progressFill = document.getElementById("progressFill");
// 	progressFill.style.width = `${percentage}%`;
// }

// // Show or hide buttons and table based on the number of uploaded files
// function toggleUIVisibility() {
// 	console.log('Called')
// 	const hasFiles = uploadedFiles.length > 0;

// 	convertButton.style.display = hasFiles ? "inline-block" : "none";
// 	clearAllButton.style.display = hasFiles ? "inline-block" : "none";
// 	imageTableContainer.style.display = hasFiles ? "block" : "none";
// 	progressBar.style.display = hasFiles ? "block" : "none";
// 	compressionSettings.style.display = hasFiles ? "block" : "none";
// }

// clearAllButton.addEventListener("click", () => {
// 	// Clear the table
// 	imageTableBody.innerHTML = "";

// 	// Clear the uploadedFiles array
// 	uploadedFiles = [];

// 	toggleUIVisibility();

// 	updateFileSummary();
// });

// function updateFileSummary() {
// 	const fileSummary = document.getElementById("fileSummary");
// 	const totalSize = uploadedFiles.reduce((acc, file) => acc + file.size, 0);
// 	fileSummary.textContent = `${uploadedFiles.length} files, total size: ${formatSize(totalSize)}`;
// }

// // Update the displayed compression value when the slider changes
// compressionRange.addEventListener("input", () => {
// 	compressionValue.textContent = compressionRange.value;
// });

// // Convert images to WebP
// convertButton.addEventListener("click", async () => {
// 	const compressionLevel = compressionRange.value; // Get the selected compression level

// 	// Show the progress bar
// 	try {
// 		const requestBody = {
// 			compressionLevel,
// 			files: uploadedFiles.map((file) => ({
// 				fileName: file.name,
// 			})),
// 		};

// 		const response = await fetch("/convert", {
// 			method: "POST",
// 			headers: { "Content-Type": "application/json" },
// 			body: JSON.stringify(requestBody),
// 		});

// 		if (!response.ok) {
// 			console.error("Conversion failed");
// 			return;
// 		}

// 		const result = await response.json();
// 		console.log("Converted files:", result.files);

// 		result.files.forEach((convertedFile, index) => {
// 			const row = imageTableBody.rows[index];

// 			// Converted size cell
// 			const convertedSizeCell = row.cells[3];
// 			convertedSizeCell.textContent = formatSize(convertedFile.size);

// 			// Compression percentage cell
// 			const originalSizeCell = row.cells[2];
// 			const originalSize = parseFloat(originalSizeCell.textContent) * 1024; // Convert back to bytes
// 			const compressionPercent = ((1 - convertedFile.size / originalSize) * 100).toFixed(0);
// 			const compressionCell = row.cells[4];
// 			compressionCell.textContent = `-${compressionPercent}%`;

// 			// Update download link
// 			const downloadCell = row.cells[5];
// 			const downloadButton = downloadCell.querySelector("a");
// 			downloadButton.href = `/webp/${encodeURIComponent(convertedFile.fileName)}`;
// 			downloadButton.download = convertedFile.fileName;
// 			downloadButton.style.pointerEvents = "auto"; // Enable the button
// 		});
// 	} catch (error) {
// 		console.error("Error during conversion:", error);
// 	}
// })

// // Format file size
// function formatSize(size) {
// 	return `${(size / 1024).toFixed(2)} KB`;
// }

