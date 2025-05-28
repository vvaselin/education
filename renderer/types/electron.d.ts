export interface IElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  // もし、send や on も preload.js で定義したなら、ここにも型を書いてあげる
  // send: (channel: string, ...args: any[]) => void;
  // on: (channel: string, listener: (...args: any[]) => void) => (() => void) | undefined;
}

declare global {
  interface Window {
    ipcRenderer: IElectronAPI;
  }
}