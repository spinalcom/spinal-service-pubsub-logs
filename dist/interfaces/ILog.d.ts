export declare enum REASON {
    restart = "restart",
    send = "send"
}
export interface ILog {
    reason: REASON;
    receiverId?: string;
}
