import {useState} from 'react'
import Navbar from "../components/navbar";
import Particles from "../components/Particles";
import FileUploader from "../components/fileUploader";
import {usePuterStore} from "../lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "../lib/pdfToImg";
import {generateUUID} from "../lib/utils.format";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const {auth, isLoading, fs, ai, kv} = usePuterStore();
    //fs: file storage, kv: key value functions.
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    }

    const handleAnalyse = async ({companyName, jobTitle, jobDescription, file}: {companyName: string, jobTitle: string, jobDescription: string, file: File}) => {
        try {
            setIsProcessing(true);
            setStatusText('File Uploading ...');
            const uploadedFile = await fs.upload([file]); //to upload file to puter.js
            if  (!uploadedFile) return setStatusText('Error: Failed to upload file');

            setStatusText('Converting to image ...');
            const imageFile = await  convertPdfToImage(file); //this function converts pdf to file

            // FIX: Check for error property in imageFile result
            if(!imageFile || imageFile.error) {
                return setStatusText(`Error: Failed to convert pdf to image - ${imageFile?.error || 'Unknown error'}`);
            }

            // FIX: Check if file property exists
            if (!imageFile.file) {
                return setStatusText('Error: No image file generated from PDF');
            }

            setStatusText('Image Uploading ...');
            // @ts-ignore
            const uploadedImage = await fs.upload([imageFile.file]);
            if  (!uploadedImage) return setStatusText('Error: Failed to upload Image');

            setStatusText('Preparing data ...');

            const uuid = generateUUID();
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName, jobTitle, jobDescription,
                feedback: '',
            }
            await kv.set(`resume:${uuid}`, JSON.stringify(data)); //to set the data in puter

            setStatusText('Analyzing data ...');

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({jobTitle, jobDescription})
            )
            if (!feedback) return setStatusText('Error: Failed to analyze resume');

            const feedbackText = typeof feedback.message.content === 'string' ? feedback.message.content : feedback.message.content[0].text; // to extract the array as text.

            // FIX: Add error handling for JSON parsing
            try {
                data.feedback = JSON.parse(feedbackText); //to parse the feedback data.
            } catch (parseError) {
                console.error('JSON Parse Error:', parseError);
                console.log('Raw feedback text:', feedbackText);
                return setStatusText('Error: Invalid response format from AI analysis');
            }

            await kv.set(`resume:${uuid}`, JSON.stringify(data));  //to update the value of keys in the keyvalue store.
            setStatusText('Analysis complete, redirecting ...');
            console.log(data);

            // FIX: Add navigation after successful analysis
            setTimeout(() => {
                navigate(`/resume/${uuid}`); // to redirect to the real resume details page, exact page
            }, 1000);

        } catch (error) {
            // FIX: Add comprehensive error handling
            console.error('Analysis error:', error);
            setStatusText('Error: Something went wrong during analysis');
            setIsProcessing(false);
        }
    } //to analyse the data provided

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); //prevents reload.
        const form = e.currentTarget.closest('form'); //to get form data without relying on state.
        if (!form) return;

        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        // FIX: Add validation for required fields
        if (!companyName || !jobTitle || !jobDescription) {
            alert('Please fill in all required fields');
            return;
        }

        if(!file) {
            alert('Please upload a resume file');
            return;
        }

        handleAnalyse({companyName, jobTitle, jobDescription, file})
    }

    return (
        <main className="relative w-full h-screen overflow-auto">
            <Navbar />
            {/* Particles Background*/}
            <div className="absolute inset-0 z-0">
                <Particles
                    particleColors={["#00ff00", "#00008b", "#ff0000"]}
                    particleCount={200}
                    particleSpread={12}
                    speed={0.2}
                    particleBaseSize={130}
                    moveParticlesOnHover={true}
                    alphaParticles={false}
                    disableRotation={false}
                    className="w-full h-full"
                />
            </div>
            <section className="main-section relative z-10 pt-12 pb-15 px-2">
                <div className="page-heading">
                    <h1>Monitor Your Applications and Resume Scores</h1>
                    {isProcessing ? (
                        <>
                            <h2>
                                {statusText}
                            </h2>
                            <img src="/images/resume-scan.gif" alt="resumeScan" className="full" />
                        </>
                    ) : (
                        <h2>Upload your resume to check your ATS score and improvement tips</h2>
                    )}
                    {!isProcessing && (
                        <form
                            id="upload-form"
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 mt-8"
                        >
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input
                                    type="text"
                                    name="company-name"
                                    placeholder="Company Name"
                                    required
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input
                                    type="text"
                                    name="job-title"
                                    placeholder="Job Title"
                                    required
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea
                                    rows={5}
                                    name="job-description"
                                    placeholder="Job Description"
                                    required
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader" className="font-semibold">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button className="primary-button" type="submit">
                                Scan Resume
                            </button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}
export default Upload