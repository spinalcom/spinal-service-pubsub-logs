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

import {
  FileSystem,
  Lst,
  Model,
  Obj,
  Ptr,
  spinalCore,
} from 'spinal-core-connectorjs_type';
import {genUID} from '../utils/genUID';
import {loadPtr} from '../utils/loadPtr';
import {ILog, ISpinalDateValue} from '../interfaces';
import {SpinalLogArchive} from './SpinalLogArchive';
import {SpinalLogArchiveDay} from './SpinalLogArchiveDay';
import {WEBSOCKET_STATE} from '../websocket_const';
import {asyncGenToArray} from '../';

class SpinalLog extends Model {
  public static relationName: string = 'hasWebsocketLogs';
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
  private logTypes: spinal.Lst;
  private logActions: spinal.Lst;

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
      state: {state: WEBSOCKET_STATE.unknow, since: Date.now()},
      logTypes: new Lst([]),
      logActions: new Lst([]),
    });
  }

  public setState(state: WEBSOCKET_STATE) {
    this.state.since.set(Date.now());
    this.state.state.set(state);
  }

  public getState(): {state: WEBSOCKET_STATE; since: number} {
    return this.state.get();
  }

  public async getFromIntervalTimeGen(
    start: number | string | Date = 0,
    end: number | string | Date = Date.now()
  ): Promise<ISpinalDateValue[]> {
    const archive = await this.getArchive();
    const gen = archive.getFromIntervalTimeGen(start, end);
    const list = await asyncGenToArray(gen);
    return list.map(({date, value}) => {
      return {
        date,
        value: this._formatLogValue(value),
      };
    });
  }

  public async getFromIntervalTime(
    start: number | string | Date = 0,
    end: number | string | Date = Date.now()
  ): Promise<ISpinalDateValue[]> {
    const archive = await this.getArchive();
    const list = await archive.getFromIntervalTime(start, end);
    return list.map(({date, value}) => {
      return {
        date,
        value: this._formatLogValue(value),
      };
    });
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
    const {date, value} = currentDay.get(len - 1);

    return {date, value: this._formatLogValue(value)};
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
    const valCopy = Object.assign({}, value);

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
    valCopy.type = this._getLogTypeIndex(value.type) as any;
    valCopy.action = this._getLogActionIndex(value.action) as any;

    currentDay.push(valCopy);
    archive.purgeArchive(this.maxDay.get());
  }

  public async insert(
    value: ILog,
    date: number | string | Date
  ): Promise<void> {
    const valCopy = Object.assign({}, value);

    let currentDay: SpinalLogArchiveDay;
    const archive = await this.getArchive();

    valCopy.type = this._getLogTypeIndex(value.type) as any;
    valCopy.action = this._getLogActionIndex(value.action) as any;

    if (this.maxDay.get() !== 0) {
      currentDay = await archive.getOrCreateArchiveAtDate(date);
      currentDay.insert(valCopy, date);
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

  public async getDataFromYesterday(): Promise<ISpinalDateValue[]> {
    const archive = await this.getArchive();
    const end = new Date().setUTCHours(0, 0, 0, -1);
    const start = new Date(end).setUTCHours(0, 0, 0, 0);
    const gen = archive.getFromIntervalTimeGen(start, end);
    const list = await asyncGenToArray(gen);

    return list.map(({date, value}) => {
      return {
        date,
        value: this._formatLogValue(value),
      };
    });
  }

  public async getDataFromLast24Hours(): Promise<ISpinalDateValue[]> {
    return this.getDataFromLastDays(1);
  }

  public async getDataFromLastHours(
    numberOfHours: number = 1
  ): Promise<ISpinalDateValue[]> {
    const archive = await this.getArchive();
    const end = Date.now();
    const start = new Date();
    start.setUTCHours(start.getUTCHours() - numberOfHours);
    const gen = archive.getFromIntervalTimeGen(start, end);
    const list = await asyncGenToArray(gen);
    return list.map(({date, value}) => {
      return {
        date,
        value: this._formatLogValue(value),
      };
    });
  }

  public async getDataFromLastDays(
    numberOfDays: number = 1
  ): Promise<ISpinalDateValue[]> {
    const archive = await this.getArchive();
    const end = Date.now();
    const start = new Date();
    start.setDate(start.getDate() - numberOfDays);
    const gen = archive.getFromIntervalTimeGen(start, end);
    const list = await asyncGenToArray(gen);
    return list.map(({date, value}) => {
      return {
        date,
        value: this._formatLogValue(value),
      };
    });
  }

  private _getLogTypeIndex(logType: string): number {
    for (let i = 0; i < this.logTypes.length; i++) {
      const element = this.logTypes[i].get();
      if (element.toLowerCase() === logType.toLowerCase()) return i;
    }

    this.logTypes.push(logType.toLowerCase());
    return this.logTypes.length - 1;
  }

  private _getLogActionIndex(action: string): number {
    for (let i = 0; i < this.logActions.length; i++) {
      const element = this.logActions[i].get();
      if (element.toLowerCase() === action.toLowerCase()) return i;
    }

    this.logActions.push(action.toLowerCase());
    return this.logActions.length - 1;
  }

  private _formatLogValue(log: ILog): ILog {
    const obj = Object.assign({}, log);
    obj.type = this.logTypes[log.type].get();
    obj.action = this.logActions[log.action].get();

    return obj;
  }
}

spinalCore.register_models(SpinalLog);
export default SpinalLog;
export {SpinalLog};
