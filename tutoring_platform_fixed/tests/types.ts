export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
}

export interface LoginData {
  token: string;
  userId: number;
  role: string;
}

export interface MessageData {
  messageId: number;
  bookingId: number;
  senderId: number;
  receiverId: number;
  messageText: string;
  createdAt: string;
}

export interface SessionNoteData {
  noteId: number;
  bookingId: number;
  tutorId: number;
  topicsCovered: string;
  homework?: string;
  nextSteps?: string;
}

export interface FileResourceData {
  fileId: number;
  bookingId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;

  
}

