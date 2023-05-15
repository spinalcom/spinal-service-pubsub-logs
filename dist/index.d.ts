import { SpinalNode } from 'spinal-model-graph';
import { SpinalLog } from './models';
import { ILog, ISpinalDateValue } from './interfaces';
import { ILogInterval } from './interfaces/ILogInterval';
import { WEBSOCKET_STATE } from './websocket_const';
export default class SpinalServiceLog {
    private spinaLogsDictionnary;
    private static _instance;
    constructor();
    static getInstance(): SpinalServiceLog;
    pushFromNode(node: SpinalNode, value: ILog): Promise<boolean>;
    insertFromNode(node: SpinalNode, value: ILog, date: number | string | Date): Promise<boolean>;
    hasLogs(node: SpinalNode): Promise<boolean>;
    getOrCreateLog(node: SpinalNode): Promise<SpinalLog>;
    private getConfigFromNode;
    private getOrCreateLogProm;
    getCurrent(node: SpinalNode): Promise<ISpinalDateValue>;
    getDataFromLast24Hours(node: SpinalNode): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getDataFromLastHours(node: SpinalNode, numberOfHours?: number): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getDataFromYesterday(node: SpinalNode): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getLogs(node: SpinalNode): Promise<SpinalLog>;
    getFromIntervalTime(node: SpinalNode, start?: string | number | Date, end?: string | number | Date): Promise<ISpinalDateValue[]>;
    getFromIntervalTimeGen(node: SpinalNode, start?: string | number | Date, end?: string | number | Date): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getData(node: SpinalNode, logIntervalDate: ILogInterval): Promise<ISpinalDateValue[]>;
    getCount(node: SpinalNode, logIntervalDate: ILogInterval): Promise<number>;
    changeWebsocketState(node: SpinalNode, state: WEBSOCKET_STATE): Promise<SpinalNode>;
    getWebsocketState(node: SpinalNode): Promise<{
        state: WEBSOCKET_STATE;
        since: number;
    }>;
    getDateFromLastHours(numberOfHours?: number): ILogInterval;
    getDateFromLastDays(numberOfDays?: number): ILogInterval;
}
declare function asyncGenToArray<T>(it: AsyncIterableIterator<T>): Promise<T[]>;
export { asyncGenToArray, SpinalServiceLog };
export * from './models';
export * from './interfaces';
export * from './websocket_const';
