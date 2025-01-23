const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const convertButton = document.getElementById("convertButton");
const clearAllButton = document.getElementById("clearAllButton");
const imageTableContainer = document.getElementById("table-container");
const imageTableBody = document.getElementById("imageTableBody");
const compressionSettings = document.getElementById("compressionSettings");
const compressionRange = document.getElementById("compressionRange");
const compressionValue = document.getElementById("compressionValue");

let uploadedFiles = []; // Track uploaded files
let convertedFiles = {}; // Track converted files by filename

// Initially hide UI elements
convertButton.style.display = "none";
clearAllButton.style.display = "none";
imageTableContainer.style.display = "none";
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
		if (!uploadedFiles.some((f) => f.name === file.name)) {
			addFileToTable(file);
			uploadedFiles.push(file);
		}
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

	// Compression cell
	const compressionCell = document.createElement("td");
	compressionCell.textContent = "Pending";

	// File type cell
	const fileTypeCell = document.createElement("td");
	const fileTypeSpan = document.createElement("span");
	fileTypeSpan.textContent = "WEBP";
	fileTypeSpan.classList.add("file-type");
	fileTypeCell.appendChild(fileTypeSpan);

	// Download cell
	const downloadCell = document.createElement("td");
	const downloadButton = document.createElement("a");
	downloadButton.textContent = "Download";
	downloadButton.href = "#";
	downloadButton.style.pointerEvents = "none"; // Disabled until converted
	downloadButton.className = "download-btn gray"; // Initially gray
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
}

// Update displayed compression quality when the slider changes
compressionRange.addEventListener("input", () => {
	const value = compressionRange.value; // Get the slider value
	compressionValue.textContent = value; // Update the displayed value
});

// resizeImageForSafari function
async function compressWithRetries(file, options, maxRetries = 3) {
	let retries = 0;
	let compressedFile;

	while (retries < maxRetries) {
		try {
			console.log(`Attempt ${retries + 1}: Compressing with quality ${options.initialQuality}`);
			compressedFile = await imageCompression(file, options);

			// If compressed size is smaller, break the loop
			if (compressedFile.size < file.size) {
				console.log("Compression succeeded:", {
					originalSize: formatSize(file.size),
					compressedSize: formatSize(compressedFile.size),
				});
				break;
			}

			// If not smaller, reduce quality for the next retry
			options.initialQuality -= 0.1;
			retries++;
		} catch (error) {
			console.error(`Compression error on attempt ${retries + 1}:`, error);
			retries++;
		}
	}

	return compressedFile;
}


async function convertFiles() {
	const totalFiles = uploadedFiles.length;

	if (totalFiles === 0) {
		alert("No files to convert!");
		return;
	}

	uploadedFiles.forEach(async (file, index) => {
		const options = {
			maxSizeMB: 1,
			maxWidthOrHeight: 1920,
			useWebWorker: true,
			fileType: "image/webp",
			initialQuality: compressionRange.value / 100, // Adjust compression based on slider
		};

		const row = imageTableBody.querySelectorAll("tr")[index];
		const compressionCell = row.cells[4];
		const convertedSizeCell = row.cells[3];

		// Set up a progress bar
		compressionCell.innerHTML = ""; // Clear "Pending"
		const progressContainer = document.createElement("div");
		progressContainer.className = "progress-container";

		const progressFill = document.createElement("div");
		progressFill.className = "progress-fill";
		progressContainer.appendChild(progressFill);
		compressionCell.appendChild(progressContainer);

		// Simulate progress update
		for (let i = 0; i <= 100; i += 20) {
			await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay
			progressFill.style.width = `${i}%`;
		}

		try {
			const compressedFile = await imageCompression(file, options);

			// Update converted size cell
			convertedSizeCell.textContent = formatSize(compressedFile.size);

			const originalSizeCell = row.cells[2];
			const originalSize = parseFloat(originalSizeCell.textContent) * 1024; // Convert back to bytes
			const compressionPercent = ((1 - compressedFile.size / originalSize) * 100).toFixed(2);

			// Replace progress bar with compression percentage
			compressionCell.textContent = `-${compressionPercent}%`;

			const downloadCell = row.cells[6];
			let downloadButton = downloadCell.querySelector(".download-btn");

			if (!convertedFiles[file.name]) {
				// First-time conversion
				convertedFiles[file.name] = compressedFile; // Save the compressed file
				downloadButton.href = URL.createObjectURL(compressedFile);
				downloadButton.download = `${file.name.split(".")[0]}.webp`;
				downloadButton.style.pointerEvents = "auto"; // Enable the button
				downloadButton.classList.remove("gray");
				downloadButton.classList.add("green"); // Turn green after conversion
			} else {
				// Update download link for adjusted compression
				URL.revokeObjectURL(downloadButton.href); // Revoke old object URL
				downloadButton.href = URL.createObjectURL(compressedFile);
				convertedFiles[file.name] = compressedFile; // Update stored file
			}
		} catch (error) {
			console.error("Error during conversion:", error);
		}
	});

	// Update overall progress bar (if applicable)
	updateProgress(100, document.getElementById("progressFill"));
}

convertButton.addEventListener("click", convertFiles);

function removeImage(row, file) {
	imageTableBody.removeChild(row);
	uploadedFiles = uploadedFiles.filter((f) => f !== file);
	delete convertedFiles[file.name]; // Remove from converted files
	toggleUIVisibility();
}

function toggleUIVisibility() {
	const hasFiles = uploadedFiles.length > 0;
	convertButton.style.display = hasFiles ? "inline-block" : "none";
	clearAllButton.style.display = hasFiles ? "inline-block" : "none";
	imageTableContainer.style.display = hasFiles ? "block" : "none";
	// progressBar.style.display = hasFiles ? "block" : "none";
	compressionSettings.style.display = hasFiles ? "block" : "none";
}

function updateProgress(percentage, progressFill) {
	// const progressFill = document.getElementById("progressFill");

	if (!progressFill) {
		return;
	}

	progressFill.style.width = `${percentage}%`;
}


function formatSize(size) {
	return `${(size / 1024).toFixed(2)} KB`;
}

clearAllButton.addEventListener("click", () => {
	imageTableBody.innerHTML = "";
	uploadedFiles = [];
	convertedFiles = {};
	updateProgress(0); // Reset progress bar
	toggleUIVisibility();
});
