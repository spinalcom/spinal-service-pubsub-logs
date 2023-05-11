import { SpinalNode } from 'spinal-model-graph';
import { SpinalLog } from './models';
import { ILog, ISpinalDateValue } from './interfaces';
import { ILogInterval } from './interfaces/ILogInterval';
export default class SpinalServiceLog {
    private spinaLogsDictionnary;
    constructor();
    pushFromEndpoint(node: SpinalNode, value: ILog): Promise<boolean>;
    insertFromEndpoint(node: SpinalNode, value: ILog, date: number | string | Date): Promise<boolean>;
    hasLogs(node: SpinalNode): Promise<boolean>;
    getOrCreateLog(node: SpinalNode): Promise<SpinalLog>;
    private getConfigFormEndpoint;
    private getOrCreateLogProm;
    getCurrent(spinalLog: SpinalLog): Promise<ISpinalDateValue>;
    getDataFromLast24Hours(spinalLog: SpinalLog): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getDataFromLastHours(spinalLog: SpinalLog, numberOfHours?: number): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getDataFromYesterday(spinalLog: SpinalLog): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getFromIntervalTime(spinalLog: SpinalLog, start?: string | number | Date, end?: string | number | Date): Promise<ISpinalDateValue[]>;
    getFromIntervalTimeGen(spinalLog: SpinalLog, start?: string | number | Date, end?: string | number | Date): Promise<AsyncIterableIterator<ISpinalDateValue>>;
    getLogs(node: SpinalNode): Promise<SpinalLog>;
    getDateFromLastHours(numberOfHours?: number): ILogInterval;
    getDateFromLastDays(numberOfDays?: number): ILogInterval;
    getData(node: SpinalNode, logIntervalDate: ILogInterval): Promise<ISpinalDateValue[]>;
    getCount(node: SpinalNode, logIntervalDate: ILogInterval): Promise<number>;
}
declare function asyncGenToArray<T>(it: AsyncIterableIterator<T>): Promise<T[]>;
export { asyncGenToArray, SpinalServiceLog };
export * from './models';
export * from './interfaces';
