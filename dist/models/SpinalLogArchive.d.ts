import { Model } from 'spinal-core-connectorjs_type';
import { SpinalLogArchiveDay } from './SpinalLogArchiveDay';
import { ISpinalDateValue } from '../interfaces';
declare class SpinalLogArchive extends Model {
    private lstDate;
    private lstItem;
    initialBlockSize: spinal.Val;
    private itemLoadedDictionary;
    private loadPtrDictionary;
    constructor(initialBlockSize?: number);
    static normalizeDate(date: number | string | Date): number;
    getTodayArchive(): Promise<SpinalLogArchiveDay>;
    getOrCreateArchiveAtDate(atDate: number | string | Date): Promise<SpinalLogArchiveDay>;
    getFromIntervalTimeGen(start?: number | string | Date, end?: number | string | Date): AsyncIterableIterator<ISpinalDateValue>;
    getFromIntervalTime(start: number | string | Date, end?: number | string | Date): Promise<ISpinalDateValue[]>;
    getArchiveAtDate(date: number | string | Date): Promise<SpinalLogArchiveDay>;
    getDates(): spinal.Lst<spinal.Val>;
    dateExist(date: number | string | Date): boolean;
    purgeArchive(maxDay: number): void;
}
export default SpinalLogArchive;
export { SpinalLogArchive };
