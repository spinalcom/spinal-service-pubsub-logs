/*
 * Copyright 2023 SpinalCom - www.spinalcom.com
 *
 * This file is part of SpinalCore.
 *
 * Please read all of the following terms and conditions
 * of the Free Software license Agreement ("Agreement")
 * carefully.
 *
 * This Agreement is a legally binding contract between
 * the Licensee (as defined below) and SpinalCom that
 * sets forth the terms and conditions that govern your
 * use of the Program. By installing and/or using the
 * Program, you agree to abide by all the terms and
 * conditions stated or referenced herein.
 *
 * If you do not agree to abide by these terms and
 * conditions, do not demonstrate your acceptance and do
 * not install or use the Program.
 * You should have received a copy of the license along
 * with this file. If not, see
 * <http://resources.spinalcom.com/licenses.pdf>.
 */

import {Model, Ptr, spinalCore} from 'spinal-core-connectorjs_type';
import {loadPtr} from '../utils/loadPtr';
import {SpinalLogArchiveDay} from './SpinalLogArchiveDay';
import {ISpinalDateValue} from '../interfaces';

class SpinalLogArchive extends Model {
  // synchronized
  private lstDate: spinal.Lst<spinal.Val>;
  private lstItem: spinal.Lst<spinal.Ptr<SpinalLogArchiveDay>>;
  public initialBlockSize: spinal.Val;

  // not synchronized
  private itemLoadedDictionary: Map<number, Promise<SpinalLogArchiveDay>>;
  private loadPtrDictionary: Map<number, Promise<SpinalLogArchiveDay>>;

  constructor(initialBlockSize: number = 50) {
    super({
      initialBlockSize,
      lstDate: [],
      lstItem: [],
    });

    this.itemLoadedDictionary = new Map();
    this.loadPtrDictionary = new Map();
  }

  public static normalizeDate(date: number | string | Date): number {
    return new Date(date).setUTCHours(0, 0, 0, 0);
  }

  public getTodayArchive(): Promise<SpinalLogArchiveDay> {
    const now = Date.now();
    const date = SpinalLogArchive.normalizeDate(now);
    const spinalLogArchiveDay = this.itemLoadedDictionary.get(date);

    if (spinalLogArchiveDay !== undefined) {
      return spinalLogArchiveDay;
    }

    for (let index = 0; index < this.lstDate.length; index += 1) {
      const element = this.lstDate[index];
      const ptr = this.lstItem[index];
      if (element.get() === date) {
        return loadPtr(this.loadPtrDictionary, ptr);
      }
    }
    const value = new SpinalLogArchiveDay(this.initialBlockSize.get());
    this.lstDate.push(date);
    this.lstItem.push(new Ptr(value));
    const prom = Promise.resolve(value);
    this.itemLoadedDictionary.set(date, prom);
    return prom;
  }

  public getOrCreateArchiveAtDate(
    atDate: number | string | Date
  ): Promise<SpinalLogArchiveDay> {
    const date = SpinalLogArchive.normalizeDate(atDate);
    const spinalLogArchiveDay = this.itemLoadedDictionary.get(date);

    if (spinalLogArchiveDay !== undefined) {
      return spinalLogArchiveDay;
    }
    for (let index = 0; index < this.lstDate.length; index += 1) {
      const element = this.lstDate[index];
      const ptr = this.lstItem[index];
      if (element.get() === date) {
        return loadPtr(this.loadPtrDictionary, ptr);
      }
    }
    const value = new SpinalLogArchiveDay(this.initialBlockSize.get());
    value.dateDay.set(date);
    // search index
    let index = 0;
    for (let idx = 0; idx < this.lstDate.length; idx += 1) {
      const element = this.lstDate[idx];
      if (element > date) {
        break;
      }
      index += 1;
    }

    this.lstDate.insert(index, [date]);
    this.lstItem.insert(index, [new Ptr(value)]);
    const prom = Promise.resolve(value);
    this.itemLoadedDictionary.set(date, prom);
    return prom;
  }

  public async *getFromIntervalTimeGen(
    start: number | string | Date = 0,
    end: number | string | Date = Date.now()
  ): AsyncIterableIterator<ISpinalDateValue> {
    const normalizedStart = SpinalLogArchive.normalizeDate(start);
    const normalizedEnd =
      typeof end === 'number' || typeof end === 'string'
        ? new Date(end).getTime()
        : end;

    if (!normalizedStart) throw new Error(`invalid date ${start}`);
    if (!normalizedEnd) throw new Error(`invalid date ${end}`);

    for (let idx = 0; idx < this.lstDate.length; idx += 1) {
      const element = this.lstDate[idx].get();
      if (normalizedStart > element) continue;
      const archive = await this.getArchiveAtDate(element);
      let index = 0;
      const archiveLen = archive.length.get();
      if (normalizedStart === element) {
        for (; index < archiveLen; index += 1) {
          const dateValue = archive.get(index);
          if (dateValue.date >= normalizedStart) {
            break;
          }
        }
      }

      for (; index < archiveLen; index += 1) {
        const dateValue: any = archive.get(index);
        if (dateValue.date > normalizedEnd) return;
        yield dateValue;
      }
    }
  }

  public async getFromIntervalTime(
    start: number | string | Date,
    end: number | string | Date = Date.now()
  ): Promise<ISpinalDateValue[]> {
    const result = [];
    for await (const data of this.getFromIntervalTimeGen(start, end)) {
      result.push(data);
    }
    return result;
  }

  public getArchiveAtDate(
    date: number | string | Date
  ): Promise<SpinalLogArchiveDay> {
    const normalizedDate: number = SpinalLogArchive.normalizeDate(date);

    if (this.itemLoadedDictionary.has(normalizedDate)) {
      return this.itemLoadedDictionary.get(normalizedDate);
    }
    const idx = this.lstDate.indexOf(normalizedDate);
    if (idx < 0) return Promise.reject(new Error(`Date '${date}' not found.`));

    const promise: Promise<SpinalLogArchiveDay> = getArchive.call(this);
    this.itemLoadedDictionary.set(normalizedDate, promise);
    return promise;

    function getArchive(): Promise<SpinalLogArchiveDay> {
      return new Promise((resolve) => {
        const ptr: spinal.Ptr<SpinalLogArchiveDay> = this.lstItem[idx];

        if (typeof ptr.data.model !== 'undefined') {
          resolve(ptr.data.model);
        } else {
          ptr.load((element: SpinalLogArchiveDay) => {
            resolve(element);
          });
        }
      });
    }
  }

  public getDates(): spinal.Lst<spinal.Val> {
    return this.lstDate;
  }

  public dateExist(date: number | string | Date): boolean {
    const normalizedDate: number = SpinalLogArchive.normalizeDate(date);
    for (let idx = this.lstDate.length - 1; idx >= 0; idx -= 1) {
      if (this.lstDate[idx].get() === normalizedDate) return true;
    }
    return false;
  }

  public purgeArchive(maxDay: number): void {
    if (maxDay > 0) {
      let lstDateToDelete = [];
      const maxDayMS = maxDay * 86400000;
      const minDateMS = new Date().valueOf() - maxDayMS;
      for (let index = 0; index < this.lstDate.length; index += 1) {
        if (this.lstDate[index].get() <= minDateMS) {
          lstDateToDelete.push(this.lstDate[index].get());
        }
      }

      for (let elt of lstDateToDelete) {
        let id = this.lstDate.indexOf(elt);
        this.lstDate.splice(id, 1);
        this.lstItem.splice(id, 1);
      }
    } else if (maxDay === 0) {
      this.lstDate.clear();
      this.lstItem.clear();
    }
  }
}

spinalCore.register_models(SpinalLogArchive);

export default SpinalLogArchive;
export {SpinalLogArchive};
