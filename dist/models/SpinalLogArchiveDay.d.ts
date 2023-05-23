import { Model } from 'spinal-core-connectorjs_type';
import { ILog, ISpinalDateValue, ISpinalDateValueArray } from '../interfaces';
export declare class SpinalLogArchiveDay extends Model {
    private lstValue;
    length: spinal.Val;
    dateDay: spinal.Val;
    constructor(initialBlockSize?: number);
    push(data: ILog): void;
    insert(data: ILog, date: number | string | Date): boolean;
    private setLstVal;
    get(index: number): ISpinalDateValue;
    get(): ISpinalDateValueArray;
    at(index: number): ISpinalDateValue;
    getActualBufferSize(): number;
    private addBufferSizeLength;
    private upgradeFromOldTimeSeries;
}
export default SpinalLogArchiveDay;
