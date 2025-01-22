const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadDir = path.join(__dirname, "uploads");
const webpDir = path.join(__dirname, "webp");

// Ensure directories exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(webpDir)) fs.mkdirSync(webpDir);

// Middleware to parse JSON request bodies
app.use(express.json());

// Multer setup to retain original filenames
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadDir); // Save files to the "uploads" folder
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname); // Use the original filename
	},
});

const upload = multer({ storage });

// Serve static files for uploads and converted files
app.use("/uploads", express.static(uploadDir));
app.use("/webp", express.static(webpDir));
app.use(express.static("public")); // Frontend files (HTML, CSS, JS)

// API to upload images
app.post("/uploads", upload.array("images"), (req, res) => {
	try {
		const files = req.files.map((file) => ({
			originalName: file.originalname,
			fileName: file.filename,
			size: file.size, // File size in bytes
		}));

		// console.log("Uploaded files:", files);

		res.json({ files });
	} catch (error) {
		console.error("Error during file upload:", error.message);
		res.status(500).json({ error: "Failed to upload files." });
	}
});

// API to convert images to WebP
app.post("/convert", async (req, res) => {
	try {
		const files = fs.readdirSync(uploadDir);
		console.log("Files in uploads directory:", files);
		const { compressionLevel } = req.body;
		const convertedFiles = [];

		for (const file of files) {
			const inputPath = path.join(uploadDir, file);
			const outputPath = path.join(webpDir, `${path.parse(file).name}.webp`);

			// Check if the current item is a valid file
			const fileStat = fs.statSync(inputPath);
			if (fileStat.isFile()) {
				console.log(`Converting file: ${file}`);

				try {
					// Convert to WebP using sharp
					// await sharp(inputPath).toFormat("webp").toFile(outputPath);
					await sharp(inputPath)
						.webp({ quality: parseInt(compressionLevel, 10) })
						.toFile(outputPath);

					// Get size of converted file
					const convertedFileSize = fs.statSync(outputPath).size;

					convertedFiles.push({
						fileName: `${path.parse(file).name}.webp`,
						size: convertedFileSize,
					});
				} catch (sharpError) {
					console.error(`Error processing file ${file}:`, sharpError.message);
				}
			}
		}

		res.json({ files: convertedFiles });
	} catch (error) {
		console.error("Error during conversion:", error.message);
		res.status(500).json({ error: "Failed to convert files." });
	}
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
