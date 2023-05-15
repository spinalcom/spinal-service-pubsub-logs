export declare enum REASON {
    restart = "restart",
    send = "send",
    noDataSent = "noDataSent"
}
export declare enum TYPE {
    alarm = "alarm",
    info = "info"
}
export interface ILog {
    reason: REASON;
    type: TYPE;
    receiverId?: string;
}
