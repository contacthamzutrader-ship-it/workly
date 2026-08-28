declare module "firebase/storage" {
  export function getStorage(app?: any): any;
  export function ref(storage: any, url?: string): any;
  export function uploadBytes(ref: any, data: any, metadata?: any): Promise<any>;
  export function getDownloadURL(ref: any): Promise<string>;
  export type FirebaseStorage = any;
}
