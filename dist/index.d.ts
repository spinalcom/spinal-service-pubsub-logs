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
    getCurrent(spinalLog: SpinalLog): Promise<ISpinalDateValue>;
    getDataFromLast24Hours(spinalLog: SpinalLog): Promise<ISpinalDateValue[]>;
    getDataFromLastHours(spinalLog: SpinalLog, numberOfHours?: number): Promise<ISpinalDateValue[]>;
    getDataFromYesterday(spinalLog: SpinalLog): Promise<ISpinalDateValue[]>;
    getLog(node: SpinalNode): Promise<SpinalLog>;
    getFromIntervalTime(spinalLog: SpinalLog, start?: string | number | Date, end?: string | number | Date): Promise<ISpinalDateValue[]>;
    getFromIntervalTimeGen(spinalLog: SpinalLog, start?: string | number | Date, end?: string | number | Date): Promise<ISpinalDateValue[]>;
    getData(node: SpinalNode, logIntervalDate: ILogInterval): Promise<ISpinalDateValue[]>;
    getCount(node: SpinalNode, logIntervalDate: ILogInterval): Promise<number>;
    changeWebsocketState(spinalLog: SpinalLog, state: WEBSOCKET_STATE): Promise<void>;
    getWebsocketState(spinalLog: SpinalLog): Promise<{
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
