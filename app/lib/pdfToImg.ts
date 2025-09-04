export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;

    // FIX: Use proper import and set worker source BEFORE using the library
    loadPromise = import("pdfjs-dist").then((lib) => {
        // FIX: Use local worker file to avoid version mismatch
        // OLD (CDN): lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
        lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";

        pdfjsLib = lib;
        isLoading = false;
        return lib;
    }).catch((error) => {
        // FIX: Add error handling for import failures
        console.error('Failed to load PDF.js:', error);
        isLoading = false;
        loadPromise = null;
        throw error;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        // FIX: Add validation for file type
        if (!file || file.type !== 'application/pdf') {
            return {
                imageUrl: "",
                file: null,
                error: "Invalid file type. Please provide a PDF file.",
            };
        }

        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();

        // FIX: Add error handling for PDF loading
        let pdf;
        try {
            pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        } catch (pdfError) {
            return {
                imageUrl: "",
                file: null,
                error: `Invalid or corrupted PDF file: ${pdfError}`,
            };
        }

        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // FIX: Add null check for context
        if (!context) {
            return {
                imageUrl: "",
                file: null,
                error: "Failed to get canvas context",
            };
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";

        // FIX: Add error handling for rendering
        try {
            await page.render({ canvasContext: context, viewport }).promise;
        } catch (renderError) {
            return {
                imageUrl: "",
                file: null,
                error: `Failed to render PDF page: ${renderError}`,
            };
        }

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}