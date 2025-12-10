import React, { useState, useCallback } from 'react';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import { FileText, Sparkles, DownloadCloud, Github, Info } from 'lucide-react';

import Dropzone from './components/Dropzone';
import FileList from './components/FileList';
import { ConvertedFile, FileStatus } from './types';
import { extractContentFromPdf } from './services/geminiService';
import { generateDocxBlob } from './services/docxService';

const App: React.FC = () => {
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleFilesSelected = (newFiles: File[]) => {
    const fileEntries: ConvertedFile[] = newFiles.map(file => ({
      id: generateId(),
      originalName: file.name,
      file: file,
      status: FileStatus.IDLE,
      progress: 0
    }));

    setFiles(prev => [...prev, ...fileEntries]);
  };

  const processFile = async (fileEntry: ConvertedFile) => {
    try {
      // 1. Update status to Processing
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? { ...f, status: FileStatus.PROCESSING } : f));

      // 2. Extract structure using Gemini
      const structure = await extractContentFromPdf(fileEntry.file);

      // 3. Convert structure to DOCX Blob
      const docxBlob = await generateDocxBlob(structure);

      // 4. Update status to Completed
      const generatedName = fileEntry.originalName.replace(/\.pdf$/i, '.docx');
      
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? {
        ...f,
        status: FileStatus.COMPLETED,
        blob: docxBlob,
        generatedFileName: generatedName,
        progress: 100
      } : f));

    } catch (err: any) {
      console.error(err);
      setFiles(prev => prev.map(f => f.id === fileEntry.id ? {
        ...f,
        status: FileStatus.ERROR,
        error: err.message || "Conversion failed"
      } : f));
    }
  };

  const handleConvertAll = async () => {
    if (files.filter(f => f.status === FileStatus.IDLE).length === 0) return;
    
    setIsProcessing(true);
    
    // Process strictly one by one to avoid rate limits (if applicable) and manage browser resources
    // A more advanced app might use a pool (e.g., p-limit)
    const idleFiles = files.filter(f => f.status === FileStatus.IDLE);
    
    for (const file of idleFiles) {
      await processFile(file);
    }
    
    setIsProcessing(false);
  };

  const handleDownload = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file && file.blob && file.generatedFileName) {
      FileSaver.saveAs(file.blob, file.generatedFileName);
    }
  };

  const handleDownloadAll = async () => {
    const completedFiles = files.filter(f => f.status === FileStatus.COMPLETED && f.blob);
    
    if (completedFiles.length === 1) {
      handleDownload(completedFiles[0].id);
      return;
    }

    const zip = new JSZip();
    completedFiles.forEach(f => {
      if (f.blob && f.generatedFileName) {
        zip.file(f.generatedFileName, f.blob);
      }
    });

    const content = await zip.generateAsync({ type: "blob" });
    FileSaver.saveAs(content, "converted_documents.zip");
  };

  const canConvert = !isProcessing && files.some(f => f.status === FileStatus.IDLE);
  const canDownloadAll = files.filter(f => f.status === FileStatus.COMPLETED).length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                DocuMorph AI
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
             <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-slate-100 rounded-full text-xs">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Powered by Gemini 2.5
             </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-4 sm:px-6">
        
        <div className="text-center max-w-2xl mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-4">
            Transform PDFs into <br/>
            <span className="text-indigo-600">Editable Word Docs</span>
          </h2>
          <p className="text-lg text-slate-600">
            Uses advanced AI to preserve formatting, headings, and lists. 
            No complex servers, processed securely in your browser session.
          </p>
        </div>

        <Dropzone 
          onFilesSelected={handleFilesSelected} 
          disabled={isProcessing}
        />

        {/* Actions Bar */}
        {(files.length > 0) && (
          <div className="w-full max-w-4xl flex justify-between items-center mb-6 animate-fade-in">
             <div className="text-sm text-slate-500">
                {files.length} document{files.length !== 1 ? 's' : ''} selected
             </div>
             <div className="flex gap-3">
                {canConvert && (
                  <button
                    onClick={handleConvertAll}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    Convert All
                  </button>
                )}
                
                {canDownloadAll && (
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all transform active:scale-95"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    Download All {files.filter(f => f.status === FileStatus.COMPLETED).length > 1 ? '(ZIP)' : ''}
                  </button>
                )}
             </div>
          </div>
        )}

        <FileList 
          files={files} 
          onDownload={handleDownload}
        />

        {/* Info Footer within Main */}
        <div className="mt-16 flex items-start gap-3 max-w-lg text-xs text-slate-400 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
           <Info className="w-5 h-5 shrink-0 text-slate-300" />
           <p>
             <strong>Privacy Note:</strong> This application uses your API Key to send file data to Google's Gemini API for structure analysis. 
             Files are not stored on our servers. Images in PDFs are currently skipped in favor of clean layout and text extraction.
           </p>
        </div>

      </main>
      
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} DocuMorph AI. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default App;