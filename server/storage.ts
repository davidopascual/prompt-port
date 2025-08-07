import { type MemoryProfile, type UploadedFile } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface for LLMBridge application
export interface IStorage {
  storeUploadedFile(file: UploadedFile): Promise<string>;
  getUploadedFile(id: string): Promise<UploadedFile | undefined>;
  storeMemoryProfile(profile: MemoryProfile): Promise<string>;
  getMemoryProfile(id: string): Promise<MemoryProfile | undefined>;
}

export class MemStorage implements IStorage {
  private uploadedFiles: Map<string, UploadedFile>;
  private memoryProfiles: Map<string, MemoryProfile>;

  constructor() {
    this.uploadedFiles = new Map();
    this.memoryProfiles = new Map();
  }

  async storeUploadedFile(file: UploadedFile): Promise<string> {
    const id = randomUUID();
    this.uploadedFiles.set(id, file);
    return id;
  }

  async getUploadedFile(id: string): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async storeMemoryProfile(profile: MemoryProfile): Promise<string> {
    const id = randomUUID();
    this.memoryProfiles.set(id, profile);
    return id;
  }

  async getMemoryProfile(id: string): Promise<MemoryProfile | undefined> {
    return this.memoryProfiles.get(id);
  }
}

export const storage = new MemStorage();
