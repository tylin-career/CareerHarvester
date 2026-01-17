import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { FileData } from '../types';

interface ResumeUploadProps {
  onUpload: (fileData: FileData) => void;
  isAnalyzing: boolean;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUpload, isAnalyzing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCloud, setUseCloud] = useState(false);

  const handleFile = (file: File) => {
    setError(null);
    
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError("Supported formats: PDF or DOCX");
      return;
    }

    if (file.size > 20 * 1024 * 1024) { 
      setError("File size exceeds 20MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      
      onUpload({
        base64,
        mimeType: file.type,
        name: file.name,
        file: file,
        useCloud: useCloud
      });
    };
    reader.onerror = () => setError("Error reading file.");
    reader.readAsDataURL(file);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [useCloud]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`relative flex flex-col items-center justify-center w-full min-h-[240px] border rounded-xl transition-all duration-200 ease-in-out
          ${dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50/50'}
          ${isAnalyzing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          id="dropzone-file" 
          type="file" 
          className="hidden" 
          onChange={handleChange}
          accept=".pdf,.docx"
          disabled={isAnalyzing}
        />
        
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full p-6 cursor-pointer">
          {isAnalyzing ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-sm text-gray-500 font-medium">Processing document...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-gray-100 rounded-lg mb-4 text-gray-600">
                <Upload className="w-6 h-6" />
              </div>
              <p className="mb-2 text-lg text-gray-900 font-medium">
                Upload Resume
              </p>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Drag and drop your PDF or DOCX file here, or click to browse.
              </p>
              <div className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm">
                Select File
              </div>
            </div>
          )}
        </label>
      </div>

      <div className="flex items-center justify-between mt-4">
        {/* Toggle Switch */}
        <label className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={useCloud} 
              onChange={(e) => setUseCloud(e.target.checked)} 
              disabled={isAnalyzing}
            />
            <div className={`w-9 h-5 rounded-full shadow-inner transition-colors duration-200 ${useCloud ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow transition-transform duration-200 ${useCloud ? 'translate-x-4' : ''}`}></div>
          </div>
          <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors select-none">
            High-Resolution Processing {useCloud && <span className="ml-1 text-blue-600 font-medium">(Enabled)</span>}
          </span>
        </label>
        
        {useCloud && (
          <span className="text-xs text-gray-400 hidden sm:inline-block">Uses Google Cloud for enhanced parsing</span>
        )}
      </div>
      
      {error && (
        <div className="flex items-center mt-4 text-red-600 bg-red-50 px-4 py-3 rounded-md text-sm border border-red-100">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
};