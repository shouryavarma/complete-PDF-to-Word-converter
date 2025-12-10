import React from 'react';
import { FileText, CheckCircle, Loader2, XCircle, Download, File as FileIcon } from 'lucide-react';
import { ConvertedFile, FileStatus } from '../types';

interface FileListProps {
  files: ConvertedFile[];
  onDownload: (id: string) => void;
  onRemove?: (id: string) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onDownload, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Files ({files.length})</h3>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {files.map((file) => (
          <div key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                <FileIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate" title={file.originalName}>
                  {file.originalName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  
                  {file.status === FileStatus.PROCESSING && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Converting...
                    </span>
                  )}
                  
                  {file.status === FileStatus.COMPLETED && (
                     <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                       <CheckCircle className="w-3 h-3" />
                       Done
                     </span>
                  )}

                  {file.status === FileStatus.ERROR && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Failed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4">
              {file.status === FileStatus.COMPLETED ? (
                <button
                  onClick={() => onDownload(file.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all shadow-sm hover:shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              ) : file.status === FileStatus.ERROR ? (
                 <span className="text-xs text-red-500 max-w-[150px] text-right truncate">
                   {file.error || "Unknown Error"}
                 </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
