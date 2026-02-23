import React, { useState, useEffect, useCallback } from 'react';
import init, { extract_preview, process_excel, PipelineConfig } from "./wasm/engine.js";
import { useDropzone } from 'react-dropzone';
import { SketchPicker } from 'react-color';

const App: React.FC = () => {
  const [wasmReady, setWasmReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploadedFile, setUploadedFile] = useState<Uint8Array | null>(null);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [hasPreview, setHasPreview] = useState(false);

  const [headerColor, setHeaderColor] = useState('#2563eb');
  const [autoFit, setAutoFit] = useState(false);

  const [previewData, setPreviewData] = useState<string[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  // 🔹 Inicializar WASM
  useEffect(() => {
    const initializeWasm = async () => {
      try {
        await init();
        setWasmReady(true);
      } catch (err) {
        setError('Failed to initialize Rust engine.');
      }
    };
    initializeWasm();
  }, []);

  // 🔹 Resetear preview si cambian configuraciones
  useEffect(() => {
    if (processedFile) {
      setProcessedFile(null);
    }
  }, [headerColor, autoFit]);

  const loadPreview = async (fileData: Uint8Array) => {
    try {
      const result = await extract_preview(fileData, 10);

      const parsed = result as any;

      setHeaders(parsed.headers);
      setPreviewData(parsed.rows);
    } catch (err) {
      console.error(err);
      setError("Preview error");
    }
  };

  // 🔹 Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const reader = new FileReader();

    setLoading(true);
    setError(null);

    reader.onload = async () => {
      try {
        const arrayBuffer = reader.result as ArrayBuffer;
        const fileData = new Uint8Array(arrayBuffer);
        setUploadedFile(fileData);
        await loadPreview(fileData);
        setProcessedFile(null);
      } catch (err) {
        setError('Error reading file.');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, []);

  // 🔹 Procesar archivo SOLO cuando el usuario haga clic
  const handleProcess = async () => {
    if (!uploadedFile || !wasmReady) return;

    setLoading(true);
    setError(null);

    try {
      // Create the PipelineConfig only after validation
      const config = new PipelineConfig(true, autoFit, true, headerColor);
      const result = await process_excel(uploadedFile, config);

      const blob = new Blob([new Uint8Array(result)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      setProcessedFile(blob);
      setHasPreview(true);
    } catch (err) {
      console.error(err);
      setError('Error processing file.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (!processedFile) return;

    const url = URL.createObjectURL(processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed_file.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewFile = async () => {
    if (!uploadedFile) {
      setError('Primero sube un archivo.');
      return;
    }

    if (!headerColor || !/^#[0-9A-Fa-f]{6}$/.test(headerColor)) {
      setError('Selecciona un color de header válido (#RRGGBB).');
      return;
    }

    setLoading(true);

    try {
      // Create the PipelineConfig only after validation
      const config = new PipelineConfig(true, autoFit, true, headerColor);
      const result = await process_excel(uploadedFile, config);

      const blob = new Blob([new Uint8Array(result)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      setProcessedFile(blob);
      setHasPreview(true);
    } catch (err) {
      setError('Error generating preview');
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4">Processing spreadsheet...</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-1/4 bg-slate-100 p-10 flex flex-col gap-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-900 bg-slate-50 hover:bg-blue-50 transition ${
            isDragActive ? 'bg-blue-100' : ''
          }`}
        >
          <input {...getInputProps()} />
          <p>Drag and drop your file here, or click to select a file.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-xl">
          <label className="block text-slate-900 font-medium mb-2">Header Color</label>
          <SketchPicker color={headerColor} onChange={(c) => setHeaderColor(c.hex)} />
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-between">
          <span className="text-slate-900 font-medium">Auto-adjust columns</span>
          <button
            onClick={() => setAutoFit(!autoFit)}
            className={`w-12 h-6 flex items-center rounded-full p-1 ${
              autoFit ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`w-4 h-4 bg-white rounded-full shadow-md transform ${
                autoFit ? 'translate-x-6' : ''
              } transition`}
            />
          </button>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${wasmReady ? 'bg-green-500' : 'bg-red-500'}`} />
          <p className="text-slate-900">{wasmReady ? 'Engine Ready' : 'Engine Loading...'}</p>
        </div>

        <button
          onClick={handleProcess}
          disabled={!uploadedFile || loading}
          className="bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-blue-700 transition"
        >
          Preview & Process
        </button>
      </aside>

      {/* Main */}
      <main className="w-3/4 p-10">
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg shadow-md mb-4">
            {error}
          </div>
        )}

        {!uploadedFile && (
          <div className="text-slate-900 text-center">
            <h2 className="text-2xl font-bold">Welcome to PrettySheet</h2>
            <p className="mt-4">Upload a file to start.</p>
          </div>
        )}

        {uploadedFile && !processedFile && (
          <div className="text-slate-900 text-center">
            <h2 className="text-xl font-semibold">Ready to process</h2>
            <p className="mt-2">Adjust settings and click Preview & Process</p>
          </div>
        )}

        {processedFile && (
          <div className="p-6 bg-white rounded-2xl shadow-xl text-center">
            <h2 className="text-slate-900 text-xl font-bold mb-4">
              Preview ready — you can download or tweak settings
            </h2>

            <button
              onClick={downloadFile}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              Download File
            </button>
          </div>
        )}

        {previewData && (
          <div className="mt-8">
            <h3 className="text-slate-900 text-lg font-bold mb-4">Preview</h3>

            <table className="table-auto w-full border-collapse border border-slate-300">
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className="border border-slate-300 p-2"
                      style={{ backgroundColor: headerColor, color: "white" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-slate-300 p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;