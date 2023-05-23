export declare type statusType = 'failed' | 'success';
export interface ILog {
    type: string;
    targetInfo?: {
        id: string;
        name: string;
    };
    nodeInfo?: {
        id: string;
        name: string;
        [key: string]: string;
    };
    action: string;
}
