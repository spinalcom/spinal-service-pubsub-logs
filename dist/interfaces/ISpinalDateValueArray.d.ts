import { ILog } from './ILog';
export interface ISpinalDateValueArray {
    dateDay: number;
    values: {
        date: number;
        value: ILog;
    }[];
}
