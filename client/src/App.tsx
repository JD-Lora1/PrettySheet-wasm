import React, { useState, useEffect, useCallback } from 'react';
import init, { process_excel } from "./wasm/engine.js";
import { useDropzone } from 'react-dropzone';
import { SketchPicker } from 'react-color';

const App: React.FC = () => {
  const [wasmReady, setWasmReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<Uint8Array | null>(null);
  const [headerColor, setHeaderColor] = useState('#2563eb');
  const [autoFit, setAutoFit] = useState(false);
  const [processedFile, setProcessedFile] = useState<Blob | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<string[][] | null>(null);

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

  useEffect(() => {
    if (uploadedFile && wasmReady) {
      handleReProcess();
    }
  }, [headerColor, autoFit]);

  const validateInputs = (fileData: Uint8Array, headerColor: string): boolean => {
    if (!fileData || fileData.length === 0) {
      setError('Uploaded file is empty or invalid.');
      return false;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(headerColor)) {
      setError(`Invalid header color format: ${headerColor}. Expected format: #RRGGBB`);
      return false;
    }

    return true;
  };

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

        // Validate inputs before calling process_excel
        if (!validateInputs(fileData, headerColor)) {
          setLoading(false);
          return;
        }

        console.log('Calling process_excel with:', { fileData });

        // Updated to handle Uint8Array return type
        const result = await process_excel(fileData);

        const blob = new Blob([new Uint8Array(result)], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        setProcessedFile(blob);

      } catch (err: any) {
        console.error('Rust Error:', err);
        setError(typeof err === 'string' ? err : 'Error processing Excel file');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  }, [autoFit, headerColor]); 

  const handleReProcess = async () => {
    if (!uploadedFile || !wasmReady) return;

    setLoading(true);
    try {
      // Call the Rust engine
      const result = await process_excel(uploadedFile);

      // Create the Blob for download using the result
      const blob = new Blob([new Uint8Array(result)], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      setProcessedFile(blob);
      setError(null);
    } catch (err: any) {
      console.error('Error procesando:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const processFile = async () => {
    if (!uploadedFile) {
      setError('No file uploaded.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await process_excel(uploadedFile);
      const blob = new Blob([new Uint8Array(result)], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      setProcessedFile(blob);
    } catch (err) {
      console.error('Error during process_excel:', err);
      setError('Error processing the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (processedFile) {
      const url = URL.createObjectURL(processedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'processed_file.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const sortHeaders = (index: number) => {
    if (previewData) {
      const sortedData = [...previewData].sort((a, b) => a[index].localeCompare(b[index]));
      setPreviewData(sortedData);
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    ...dropzoneProps
  } = useDropzone({ onDrop });

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4">Rust Engine is optimizing your spreadsheet...</p>
          </div>
        </div>
      )}

      <aside className="w-1/4 bg-slate-100 p-10 flex flex-col gap-8">
        <div {...getRootProps()} className={`border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-900 bg-slate-50 hover:bg-blue-50 transition duration-300 ${isDragActive ? 'bg-blue-100' : ''} ${isDragAccept ? 'border-green-500' : ''} ${isDragReject ? 'border-red-500' : ''}`}>
          <input {...getInputProps()} />
          <p>Drag and drop your file here, or click to select a file.</p>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-xl">
          <label className="block text-slate-900 font-medium mb-2">Header Color</label>
          <SketchPicker color={headerColor} onChange={(color) => setHeaderColor(color.hex)} />
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-between">
          <span className="text-slate-900 font-medium">Auto-adjust columns</span>
          <button
            onClick={() => setAutoFit(!autoFit)}
            className={`w-12 h-6 flex items-center bg-slate-300 rounded-full p-1 ${autoFit ? 'bg-blue-600' : ''}`}
          >
            <span className={`w-4 h-4 bg-white rounded-full shadow-md transform ${autoFit ? 'translate-x-6' : ''} transition duration-300`}></span>
          </button>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${wasmReady ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <p className="text-slate-900">{wasmReady ? 'Engine Ready' : 'Engine Loading...'}</p>
        </div>
      </aside>

      <main className="w-3/4 p-10">
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg shadow-md mb-4">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 underline">Dismiss</button>
          </div>
        )}

        {processedFile ? (
          <div className="p-6 bg-white rounded-2xl shadow-xl text-center">
            <h2 className="text-slate-900 text-xl font-bold mb-4">File Processed Successfully!</h2>
            <button
              onClick={downloadFile}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Download File
            </button>
          </div>
        ) : (
          <div className="text-slate-900 text-center">
            <h2 className="text-2xl font-bold">Welcome to PrettySheet</h2>
            <p className="mt-4">Upload a file to get started.</p>
          </div>
        )}

        {previewData && (
          <div className="mt-8">
            <h3 className="text-slate-900 text-lg font-bold mb-4">Preview</h3>
            <table className="table-auto w-full border-collapse border border-slate-300">
              <thead>
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="border border-slate-300 p-2 bg-slate-200 cursor-pointer hover:bg-slate-300"
                      onClick={() => sortHeaders(index)}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-slate-300 p-2">
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