export enum FileStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export interface ConvertedFile {
  id: string;
  originalName: string;
  file: File;
  status: FileStatus;
  progress: number; // 0 to 100
  blob?: Blob; // The converted DOCX blob
  error?: string;
  generatedFileName?: string;
}

// Structure expected from Gemini JSON response
export enum DocElementType {
  HEADING_1 = 'h1',
  HEADING_2 = 'h2',
  HEADING_3 = 'h3',
  PARAGRAPH = 'p',
  BULLET = 'bullet',
  CODE = 'code'
}

export interface DocElement {
  type: DocElementType;
  content: string;
}

export interface DocStructure {
  elements: DocElement[];
}
