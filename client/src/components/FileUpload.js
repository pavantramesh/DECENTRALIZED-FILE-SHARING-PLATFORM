import { useState } from "react";
import axios from "axios";
import "./FileUpload.css";

const FileUpload = ({ contract, account, provider }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("No file selected");
  const [fileType, setFileType] = useState(""); // 'image' or 'video'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: `df5f6ad10172d4ddc728`,
            pinata_secret_api_key: `bbc910412ed403ddac67782435028b3d959ea559acbecaf3fba95ee8a7d3c13a`,
            "Content-Type": "multipart/form-data",
          },
        });
        
        const fileHash = `ipfs://${resFile.data.IpfsHash}`;
        await contract.add(account, fileHash);
        alert("Successfully File Uploaded");
        setFileName("No file selected");
        setFile(null);
        setFileType("");
      } catch (e) {
        console.error(e);
        alert("Unable to upload file to Pinata");
      }
    }
  };

  const retrieveFile = (e) => {
    const data = e.target.files[0];
    if (!data) return;

    // Check file type
    const fileType = data.type.split('/')[0];
    if (fileType === 'image' || data.type === 'video/mp4') {
      setFileType(fileType === 'image' ? 'image' : 'video');
      setFile(data);
      setFileName(data.name);
    } else {
      alert("Please select an image or MP4 video file");
      e.target.value = ''; // Clear the file input
    }
  };

  return (
    <div className="top">
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="file-upload" className="choose">
          Choose File
        </label>
        <input
          disabled={!account}
          type="file"
          id="file-upload"
          name="data"
          onChange={retrieveFile}
          accept="image/*,video/mp4"
        />
        <span className="textArea">File: {fileName}</span>
        <button type="submit" className="upload" disabled={!file}>
          Upload File
        </button>
      </form>
    </div>
  );
};

export default FileUpload;