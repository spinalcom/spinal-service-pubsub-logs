"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalLogArchiveDay = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
class SpinalLogArchiveDay extends spinal_core_connectorjs_type_1.Model {
    constructor(initialBlockSize = 50) {
        super();
        if (spinal_core_connectorjs_type_1.FileSystem._sig_server === false)
            return;
        this.add_attr({
            lstDate: new spinal_core_connectorjs_type_1.Lst(Array(initialBlockSize).fill(0)),
            lstValue: new spinal_core_connectorjs_type_1.Lst(Array(initialBlockSize).fill(new spinal_core_connectorjs_type_1.Model({}))),
            dateDay: new Date().setUTCHours(0, 0, 0, 0),
            length: 0,
        });
    }
    push(data) {
        this.upgradeFromOldTimeSeries();
        if (this.lstDate.length <= this.length.get())
            this.addBufferSizeLength();
        this.setLstVal(this.length.get(), Date.now(), data);
        this.length.set(this.length.get() + 1);
    }
    insert(data, date) {
        this.upgradeFromOldTimeSeries();
        const targetDate = new Date(date).getTime();
        const maxDate = new Date(this.dateDay.get()).setUTCHours(23, 59, 59, 999);
        if (!(this.dateDay.get() <= targetDate && targetDate <= maxDate))
            return false;
        if (this.lstDate.length <= this.length.get())
            this.addBufferSizeLength();
        let index = 0;
        for (; index < this.length.get(); index += 1) {
            const element = this.lstDate[index].get();
            if (element === targetDate) {
                // check exist
                this.lstValue[index].set(data);
                return true;
            }
            if (element > targetDate)
                break;
        }
        if (index === this.length.get()) {
            this.setLstVal(this.length.get(), targetDate, data);
            this.length.set(this.length.get() + 1);
        }
        else {
            for (let idx = this.length.get() - 1; idx >= index; idx -= 1) {
                this.setLstVal(idx + 1, this.lstDate[idx].get(), this.lstValue[idx].get());
            }
            this.setLstVal(index, targetDate, data);
            this.length.set(this.length.get() + 1);
        }
        return true;
    }
    setLstVal(idx, date, value) {
        this.lstDate[idx].set(date);
        this.lstValue[idx].set(value);
    }
    get(index) {
        if (typeof index === 'number')
            return this.at(index);
        if (this.lstDate instanceof spinal_core_connectorjs_type_1.TypedArray)
            return {
                dateDay: this.dateDay.get(),
                // @ts-ignore
                date: this.lstDate.get().subarray(0, this.length.get()),
                // @ts-ignore
                value: this.lstValue.get().subarray(0, this.length.get()),
            };
        const date = [], value = [];
        for (let idx = 0; idx < this.length.get(); idx++) {
            date.push(this.lstDate[idx].get());
            value.push(this.lstValue[idx].get());
        }
        return {
            dateDay: this.dateDay.get(),
            date,
            value,
        };
    }
    at(index) {
        if (index >= this.length.get() || index < 0) {
            return undefined;
        }
        if (this.lstDate instanceof spinal_core_connectorjs_type_1.TypedArray) {
            return {
                date: this.lstDate.get(index),
                // @ts-ignore
                value: this.lstValue.get(index),
            };
        }
        return {
            date: this.lstDate[index].get(),
            value: this.lstValue[index].get(),
        };
    }
    getActualBufferSize() {
        return this.lstDate.length;
    }
    addBufferSizeLength() {
        this.upgradeFromOldTimeSeries();
        for (let idx = this.length.get(); idx < this.length.get() * 2; idx++) {
            this.lstDate.push(0);
            this.lstValue.push(new spinal_core_connectorjs_type_1.Model({}));
        }
    }
    upgradeFromOldTimeSeries() {
        if (this.lstDate instanceof spinal_core_connectorjs_type_1.TypedArray) {
            const tmpDate = this.lstDate;
            const tmpValue = this.lstValue;
            this.mod_attr('lstDate', tmpDate.get());
            this.mod_attr('lstValue', tmpValue.get());
        }
    }
}
exports.SpinalLogArchiveDay = SpinalLogArchiveDay;
exports.default = SpinalLogArchiveDay;
spinal_core_connectorjs_type_1.spinalCore.register_models(SpinalLogArchiveDay);
//# sourceMappingURL=SpinalLogArchiveDay.js.map