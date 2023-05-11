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

import {FileSystem, Model, Ptr, spinalCore} from 'spinal-core-connectorjs_type';
import {genUID} from '../utils/genUID';
import {loadPtr} from '../utils/loadPtr';
import {ILog, ISpinalDateValue} from '../interfaces';
import {SpinalLogArchive} from './SpinalLogArchive';
import {SpinalLogArchiveDay} from './SpinalLogArchiveDay';

class SpinalLog extends Model {
  public static relationName: string = 'hasLogs';
  public static nodeTypeName: string = 'SpinalLog';

  public id: spinal.Str;
  public currentArchive: spinal.Ptr<SpinalLogArchiveDay>;
  public archive: spinal.Ptr<SpinalLogArchive>;

  public archiveProm: Promise<SpinalLogArchive>;
  public currentProm: Promise<SpinalLogArchiveDay>;
  private loadPtrDictionary: Map<
    number,
    Promise<SpinalLogArchiveDay | SpinalLogArchive>
  >;

  public maxDay: spinal.Val;

  constructor(initialBlockSize: number = 50, maxDay: number = 2) {
    super();
    this.archiveProm = null;
    this.currentProm = null;
    this.loadPtrDictionary = new Map();
    if (FileSystem._sig_server === false) return;

    const archive = new SpinalLogArchive(initialBlockSize);
    this.archiveProm = Promise.resolve(archive);

    this.add_attr({
      id: genUID(),
      maxDay,
      archive: new Ptr(archive),
      currentArchive: new Ptr(0),
      currentData: 0,
    });
  }

  public async getFromIntervalTimeGen(
    start: number | string | Date = 0,
    end: number | string | Date = Date.now()
  ): Promise<AsyncIterableIterator<ISpinalDateValue>> {
    const archive = await this.getArchive();
    return archive.getFromIntervalTimeGen(start, end);
  }

  public async getFromIntervalTime(
    start: number | string | Date = 0,
    end: number | string | Date = Date.now()
  ): Promise<ISpinalDateValue[]> {
    const archive = await this.getArchive();
    return archive.getFromIntervalTime(start, end);
  }

  public async getCurrent(): Promise<ISpinalDateValue> {
    if (this.maxDay.get() === 0) {
      //@ts-ignore
      return Promise.resolve({
        date: NaN,
        value: NaN,
      });
    }
    let currentDay: SpinalLogArchiveDay;
    try {
      currentDay = await this.getCurrentDay();
    } catch (error) {
      const archive = await this.getArchive();
      currentDay = await archive.getTodayArchive();
    }
    const len = currentDay.length.get();
    return currentDay.get(len - 1);
  }

  public async setConfig(
    initialBlockSize: number,
    maxDay: number
  ): Promise<void> {
    const archive = await this.getArchive();
    archive.initialBlockSize.set(initialBlockSize);
    if (typeof this.maxDay === 'undefined') {
      this.add_attr('maxDay', maxDay);
    } else this.maxDay.set(maxDay);
  }

  public async push(value: ILog): Promise<void> {
    if (this.maxDay.get() === 0) {
      const archive = await this.getArchive();
      archive.purgeArchive(this.maxDay.get());
      return;
    }
    let currentDay: SpinalLogArchiveDay;
    try {
      currentDay = await this.getCurrentDay();
    } catch (error) {
      const archive = await this.getArchive();
      currentDay = await archive.getTodayArchive();
    }
    const normalizedDate: number = SpinalLogArchive.normalizeDate(Date.now());
    const archive = await this.getArchive();

    if (currentDay.dateDay.get() !== normalizedDate) {
      //const archive = await this.getArchive();
      this.currentProm = archive.getTodayArchive();
      currentDay = await this.currentProm;
    }
    currentDay.push(value);
    archive.purgeArchive(this.maxDay.get());
  }

  public async insert(
    value: ILog,
    date: number | string | Date
  ): Promise<void> {
    let currentDay: SpinalLogArchiveDay;
    const archive = await this.getArchive();
    if (this.maxDay.get() !== 0) {
      currentDay = await archive.getOrCreateArchiveAtDate(date);
      currentDay.insert(value, date);
    }
    archive.purgeArchive(this.maxDay.get());
  }

  public async getDataOfDay(
    date: number | string | Date
  ): Promise<SpinalLogArchiveDay> {
    const archive = await this.getArchive();
    return archive.getArchiveAtDate(date);
  }

  public getArchive(): Promise<SpinalLogArchive> {
    if (this.archiveProm !== null) return this.archiveProm;
    this.archiveProm = <Promise<SpinalLogArchive>>(
      loadPtr(this.loadPtrDictionary, this.archive)
    );
    return this.archiveProm;
  }

  public getCurrentDay(): Promise<SpinalLogArchiveDay> {
    if (this.currentProm !== null) return this.currentProm;
    this.currentProm = <Promise<SpinalLogArchiveDay>>(
      loadPtr(this.loadPtrDictionary, this.currentArchive)
    );
    return this.currentProm;
  }

  public async getDataFromYesterday(): Promise<
    AsyncIterableIterator<ISpinalDateValue>
  > {
    const archive = await this.getArchive();
    const end = new Date().setUTCHours(0, 0, 0, -1);
    const start = new Date(end).setUTCHours(0, 0, 0, 0);
    return archive.getFromIntervalTimeGen(start, end);
  }

  public getDataFromLast24Hours(): Promise<
    AsyncIterableIterator<ISpinalDateValue>
  > {
    return this.getDataFromLastDays(1);
  }

  public async getDataFromLastHours(
    numberOfHours: number = 1
  ): Promise<AsyncIterableIterator<ISpinalDateValue>> {
    const archive = await this.getArchive();
    const end = Date.now();
    const start = new Date();
    start.setUTCHours(start.getUTCHours() - numberOfHours);
    return archive.getFromIntervalTimeGen(start, end);
  }

  public async getDataFromLastDays(
    numberOfDays: number = 1
  ): Promise<AsyncIterableIterator<ISpinalDateValue>> {
    const archive = await this.getArchive();
    const end = Date.now();
    const start = new Date();
    start.setDate(start.getDate() - numberOfDays);
    return archive.getFromIntervalTimeGen(start, end);
  }
}

spinalCore.register_models(SpinalLog);
export default SpinalLog;
export {SpinalLog};
