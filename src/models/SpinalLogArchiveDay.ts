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
  Model,
  FileSystem,
  spinalCore,
  Lst,
  TypedArray,
} from 'spinal-core-connectorjs_type';
import {ILog, ISpinalDateValue, ISpinalDateValueArray} from '../interfaces';

export class SpinalLogArchiveDay extends Model {
  // private lstDate: spinal.Lst<spinal.Val>;
  // private lstValue: spinal.Lst<any>;

  private lstValue: spinal.Lst<spinal.Lst>;
  public length: spinal.Val;
  public dateDay: spinal.Val;

  constructor(initialBlockSize: number = 50) {
    super();
    if (FileSystem._sig_server === false) return;

    this.add_attr({
      // lstDate: new Lst(Array(initialBlockSize).fill(0)),
      // lstValue: new Lst(Array(initialBlockSize).fill(new Model({}))),
      lstValue: new Lst(Array(initialBlockSize).fill([0, new Model({})])),
      dateDay: new Date().setUTCHours(0, 0, 0, 0),
      length: 0,
    });
  }

  push(data: ILog): void {
    this.upgradeFromOldTimeSeries();
    if (this.lstValue.length <= this.length.get()) this.addBufferSizeLength();
    this.setLstVal(this.length.get(), Date.now(), data);
    this.length.set(this.length.get() + 1);
  }

  insert(data: ILog, date: number | string | Date): boolean {
    this.upgradeFromOldTimeSeries();
    const targetDate = new Date(date).getTime();
    const maxDate = new Date(this.dateDay.get()).setUTCHours(23, 59, 59, 999);
    if (!(this.dateDay.get() <= targetDate && targetDate <= maxDate))
      return false;

    if (this.lstValue.length <= this.length.get()) this.addBufferSizeLength();
    let index = 0;
    for (; index < this.length.get(); index += 1) {
      const element = this.lstValue[index].get();
      const elementDate = element[0];

      if (elementDate === targetDate) {
        // check exist
        this.lstValue[index][1].set(new Model(data));
        return true;
      }
      if (elementDate > targetDate) break;
    }
    if (index === this.length.get()) {
      this.setLstVal(this.length.get(), targetDate, data);
      this.length.set(this.length.get() + 1);
    } else {
      for (let idx = this.length.get() - 1; idx >= index; idx -= 1) {
        this.setLstVal(
          idx + 1,
          this.lstValue[idx][0].get(),
          this.lstValue[idx][1].get()
        );
      }
      this.setLstVal(index, targetDate, data);
      this.length.set(this.length.get() + 1);
    }
    return true;
  }

  private setLstVal(idx: number, date: number, value: ILog): void {
    // this.lstDate[idx].set(date);
    const value_model = new Model(value);
    this.lstValue[idx][0].set(date);
    this.lstValue[idx].set_or_push(1, value_model);
  }

  get(index: number): ISpinalDateValue;
  get(): ISpinalDateValueArray;
  get(index?: number): ISpinalDateValue | ISpinalDateValueArray {
    if (typeof index === 'number') return this.at(index);
    if (this.lstValue instanceof TypedArray) {
      return {
        dateDay: this.dateDay.get(),
        values: this.lstValue.get().reduce((list, item: any) => {
          list.push({
            date: item[0],
            value: item[1],
          });

          return list;
        }, []),
      };
    }

    const values = [];
    for (let idx = 0; idx < this.length.get(); idx++) {
      values.push({
        date: this.lstValue[idx][0].get(),
        value: this.lstValue[idx][1].get(),
      });
    }

    return {
      dateDay: this.dateDay.get(),
      values,
    };
  }

  public at(index: number): ISpinalDateValue {
    if (index >= this.length.get() || index < 0) {
      return undefined;
    }
    if (this.lstValue instanceof TypedArray) {
      return {
        date: this.lstValue.get(index)[0],
        // @ts-ignore
        value: this.lstValue.get(index)[1],
      };
    }
    return {
      date: this.lstValue[index].get()[0],
      value: this.lstValue[index].get()[1],
    };
  }

  public getActualBufferSize(): number {
    return this.lstValue.length;
  }

  private addBufferSizeLength() {
    this.upgradeFromOldTimeSeries();
    for (let idx = this.length.get(); idx < this.length.get() * 2; idx++) {
      // this.lstDate.push(0);
      // this.lstValue.push(new Model({}));
      this.lstValue.push([0, new Model({})]);
    }
  }

  private upgradeFromOldTimeSeries() {
    if (this.lstValue instanceof TypedArray) {
      // const tmpDate = this.lstDate;
      // const tmpValue = this.lstValue;
      const tmpValue = this.lstValue;

      this.mod_attr('lstValue', tmpValue);
      // this.mod_attr('lstDate', tmpDate.get());
      // this.mod_attr('lstValue', tmpValue.get());
    }
  }
}

export default SpinalLogArchiveDay;

spinalCore.register_models(SpinalLogArchiveDay);
