declare module 'virtual:pwa-register' {
    export interface RegisterSWOptions {
        immediate?: boolean;
        intervalMS?: number;
        onNeedRefresh?: () => void;
        onOfflineReady?: () => void;
        onRegisteredSW?: (swScriptUrl: string) => void;
        onRegisterError?: (error: any) => void;
    }

    export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => void;
}
