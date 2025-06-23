import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// PUBLIC_INTERFACE
/**
 * App - Main UI for image processing front-end.
 * Includes: header, main upload/preview area, sidebar (filter tools), and footer.
 * Handles all user interaction and communicates with backend REST API.
 */
function App() {
  const [availableFilters, setAvailableFilters] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImagePreviewUrl, setUploadedImagePreviewUrl] = useState("");
  const [uploadedImageId, setUploadedImageId] = useState("");
  const [processedImageUrl, setProcessedImageUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef(null);

  // Backend base URL
  const API_BASE = "https://vscode-internal-8470-dev.dev01.cloud.kavia.ai:3001";

  // Fetch filters from backend
  useEffect(() => {
    fetch(`${API_BASE}/filters`)
      .then(res => res.json())
      .then(data => {
        setAvailableFilters(data.filters || []);
        if (data.filters && data.filters.length > 0) {
          setSelectedFilter(data.filters[0]);
        }
      })
      .catch(() => setStatusMsg("Error fetching filter options."));
  }, []);

  // Handle file input change
  function handleFileChange(e) {
    const file = e.target.files[0];
    setProcessedImageUrl("");
    setUploadedImageId("");
    if (file) {
      setUploadedImage(file);
      setUploadedImagePreviewUrl(URL.createObjectURL(file));
    }
  }

  // Upload image to backend
  async function handleUpload() {
    setStatusMsg("");
    if (!uploadedImage) {
      setStatusMsg("Please select an image to upload.");
      return;
    }
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedImage);
      const resp = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!resp.ok) throw new Error("Upload failed.");
      const data = await resp.json();
      setUploadedImageId(data.image_id);
      setStatusMsg("Image uploaded. Now choose a filter and process.");
    } catch (e) {
      setStatusMsg("Failed to upload image.");
      setUploadedImageId("");
    }
    setProcessing(false);
  }

  // Send process request to backend
  async function handleProcess() {
    setStatusMsg("");
    if (!uploadedImageId) {
      setStatusMsg("Please upload an image first.");
      return;
    }
    setProcessing(true);
    try {
      const resp = await fetch(`${API_BASE}/process/${uploadedImageId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filter: selectedFilter }),
      });
      if (!resp.ok) throw new Error("Processing failed.");
      const data = await resp.json();
      if (data.processed_image_url) {
        setProcessedImageUrl(`${API_BASE}${data.processed_image_url}`);
        setStatusMsg("Processing complete. You can preview and download the image.");
      } else {
        setStatusMsg("Processing complete, but no output URL given.");
      }
    } catch (e) {
      setStatusMsg("Failed to process image.");
      setProcessedImageUrl("");
    }
    setProcessing(false);
  }

  // Download processed image
  function handleDownload() {
    if (!processedImageUrl) return;
    // Trigger download via anchor.
    const link = document.createElement("a");
    link.href = processedImageUrl;
    link.download = "processed-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Reset current state
  function handleReset() {
    setUploadedImage(null);
    setUploadedImagePreviewUrl("");
    setUploadedImageId("");
    setProcessedImageUrl("");
    setStatusMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="app">
      <Header />

      <main style={{ flex: "1 0 auto", display: "flex", paddingTop: 100 }}>
        {/* Sidebar for filters and actions */}
        <Sidebar
          filters={availableFilters}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          onProcess={handleProcess}
          onReset={handleReset}
          canProcess={!!uploadedImageId && !!selectedFilter && !processing}
          processing={processing}
        />
        {/* Central main area for upload, preview, results */}
        <div className="main-content" style={{ flex: 1, minWidth: 0, padding: "32px 16px" }}>
          <ImageUpload
            uploadedImage={uploadedImage}
            uploadedImagePreviewUrl={uploadedImagePreviewUrl}
            fileInputRef={fileInputRef}
            processing={processing}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            canUpload={!!uploadedImage && !processing && !uploadedImageId}
          />
          <ImagePreview
            uploadedImagePreviewUrl={uploadedImagePreviewUrl}
            processedImageUrl={processedImageUrl}
            processing={processing}
          />
          {processedImageUrl && (
            <button className="btn btn-large" style={{ marginTop: 22 }} onClick={handleDownload}>
              Download Processed Image
            </button>
          )}
          {statusMsg && (
            <div style={{ marginTop: 16, color: "#00eebe", minHeight: "1.2em" }}>{statusMsg}</div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Header component
function Header() {
  return (
    <nav className="navbar" style={{ position: "fixed", top: 0, width: "100%", zIndex: 100 }}>
      <div className="container" style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="logo">
          <span className="logo-symbol">*</span> ImageTransform Pro
        </div>
        <span style={{ color: "#00eebe", fontWeight: 400 }}>Modern React App</span>
      </div>
    </nav>
  );
}

// Sidebar component
function Sidebar({
  filters,
  selectedFilter,
  setSelectedFilter,
  onProcess,
  onReset,
  canProcess,
  processing,
}) {
  return (
    <aside
      className="sidebar"
      style={{
        width: 230,
        background: "rgba(0, 255, 255, 0.045)",
        borderRight: "1px solid var(--border-color)",
        padding: "38px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "stretch",
        minHeight: 580,
        marginTop: -16,
      }}
    >
      <div style={{ fontWeight: 500, fontSize: 18, marginBottom: 10 }}>
        Filters &amp; Tools
      </div>
      <div style={{ flex: 1 }}>
        {filters.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filters.map((filter) => (
              <li key={filter}>
                <label
                  style={{
                    display: "block",
                    padding: "7px 6px",
                    borderRadius: "4px",
                    background:
                      filter === selectedFilter
                        ? "var(--base-light)"
                        : "transparent",
                    color: filter === selectedFilter ? "#000" : "var(--text-color)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    name="filter"
                    type="radio"
                    value={filter}
                    checked={filter === selectedFilter}
                    onChange={() => setSelectedFilter(filter)}
                    style={{ marginRight: 8 }}
                  />
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            No filters available
          </div>
        )}
      </div>
      <button
        className="btn"
        style={{ marginBottom: 6 }}
        onClick={onProcess}
        disabled={!canProcess}
      >
        {processing ? "Processing..." : "Apply Filter"}
      </button>
      <button
        className="btn"
        style={{
          background: "none",
          color: "var(--base-light)",
          border: "1px solid var(--base-light)",
          marginTop: 2,
        }}
        onClick={onReset}
        disabled={processing}
      >
        Reset
      </button>
    </aside>
  );
}

// Image upload and control component
function ImageUpload({
  uploadedImage,
  uploadedImagePreviewUrl,
  fileInputRef,
  processing,
  onFileChange,
  onUpload,
  canUpload,
}) {
  return (
    <div
      className="image-upload"
      style={{
        background: "rgba(0,255,255,0.04)",
        border: "1px solid var(--border-color)",
        borderRadius: 9,
        padding: 24,
        marginBottom: 30,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: "center",
        boxShadow: "0 2px 9px 0 rgba(0,255,255,0.02)",
      }}
    >
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ marginBottom: 10 }}
        disabled={processing}
      />
      <button
        className="btn"
        onClick={onUpload}
        disabled={!canUpload}
        style={{ width: 170, margin: "0 auto" }}
      >
        Upload Image
      </button>
      {uploadedImagePreviewUrl && (
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Selected: {uploadedImage && uploadedImage.name}
        </div>
      )}
    </div>
  );
}

// Preview before/after image
function ImagePreview({ uploadedImagePreviewUrl, processedImageUrl, processing }) {
  if (!uploadedImagePreviewUrl && !processedImageUrl) return null;

  return (
    <div
      className="image-preview"
      style={{
        display: "flex",
        gap: 36,
        alignItems: "flex-start",
        justifyContent: "center",
        margin: "28px 0",
      }}
    >
      <div>
        <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 15 }}>Original</div>
        {uploadedImagePreviewUrl && (
          <img
            src={uploadedImagePreviewUrl}
            alt="Upload preview"
            style={{
              maxWidth: 240,
              maxHeight: 260,
              borderRadius: 7,
              border: "1px solid var(--border-color)",
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.03)",
            }}
          />
        )}
      </div>
      <div>
        <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 15 }}>Processed</div>
        {processing && (
          <div
            style={{
              width: 240,
              height: 220,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--base-light)",
            }}
          >
            Processing...
          </div>
        )}
        {processedImageUrl && (
          <img
            src={processedImageUrl}
            alt="Processed result"
            style={{
              maxWidth: 240,
              maxHeight: 260,
              borderRadius: 7,
              border: "1px solid var(--base-light)",
              boxShadow: "0 2px 8px 0 rgba(0,255,255,0.11)",
            }}
          />
        )}
      </div>
    </div>
  );
}

// Footer component
function Footer() {
  return (
    <footer
      className="footer"
      style={{
        background: "var(--base-dark)",
        color: "var(--text-secondary)",
        textAlign: "center",
        padding: "22px 0 15px 0",
        borderTop: "1px solid var(--border-color)",
        fontSize: 15,
        marginTop: "auto",
      }}
    >
      <div>
        <span>
          &copy; {new Date().getFullYear()} ImageTransform Pro &mdash; Modern minimal image processing.{" "}
        </span>
        <span style={{ color: "var(--base-light)", marginLeft: 8 }}>
          Powered by KAVIA AI Stack.
        </span>
      </div>
    </footer>
  );
}

export default App;
