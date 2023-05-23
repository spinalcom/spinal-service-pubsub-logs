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
            // lstDate: new Lst(Array(initialBlockSize).fill(0)),
            // lstValue: new Lst(Array(initialBlockSize).fill(new Model({}))),
            lstValue: new spinal_core_connectorjs_type_1.Lst(Array(initialBlockSize).fill([0, new spinal_core_connectorjs_type_1.Model({})])),
            dateDay: new Date().setUTCHours(0, 0, 0, 0),
            length: 0,
        });
    }
    push(data) {
        this.upgradeFromOldTimeSeries();
        if (this.lstValue.length <= this.length.get())
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
        if (this.lstValue.length <= this.length.get())
            this.addBufferSizeLength();
        let index = 0;
        for (; index < this.length.get(); index += 1) {
            const element = this.lstValue[index].get();
            const elementDate = element[0];
            if (elementDate === targetDate) {
                // check exist
                this.lstValue[index][1].set(new spinal_core_connectorjs_type_1.Model(data));
                return true;
            }
            if (elementDate > targetDate)
                break;
        }
        if (index === this.length.get()) {
            this.setLstVal(this.length.get(), targetDate, data);
            this.length.set(this.length.get() + 1);
        }
        else {
            for (let idx = this.length.get() - 1; idx >= index; idx -= 1) {
                this.setLstVal(idx + 1, this.lstValue[idx][0].get(), this.lstValue[idx][1].get());
            }
            this.setLstVal(index, targetDate, data);
            this.length.set(this.length.get() + 1);
        }
        return true;
    }
    setLstVal(idx, date, value) {
        // this.lstDate[idx].set(date);
        const value_model = new spinal_core_connectorjs_type_1.Model(value);
        this.lstValue[idx][0].set(date);
        this.lstValue[idx].set_or_push(1, value_model);
    }
    get(index) {
        if (typeof index === 'number')
            return this.at(index);
        if (this.lstValue instanceof spinal_core_connectorjs_type_1.TypedArray) {
            return {
                dateDay: this.dateDay.get(),
                values: this.lstValue.get().reduce((list, item) => {
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
    at(index) {
        if (index >= this.length.get() || index < 0) {
            return undefined;
        }
        if (this.lstValue instanceof spinal_core_connectorjs_type_1.TypedArray) {
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
    getActualBufferSize() {
        return this.lstValue.length;
    }
    addBufferSizeLength() {
        this.upgradeFromOldTimeSeries();
        for (let idx = this.length.get(); idx < this.length.get() * 2; idx++) {
            // this.lstDate.push(0);
            // this.lstValue.push(new Model({}));
            this.lstValue.push([0, new spinal_core_connectorjs_type_1.Model({})]);
        }
    }
    upgradeFromOldTimeSeries() {
        if (this.lstValue instanceof spinal_core_connectorjs_type_1.TypedArray) {
            // const tmpDate = this.lstDate;
            // const tmpValue = this.lstValue;
            const tmpValue = this.lstValue;
            this.mod_attr('lstValue', tmpValue);
            // this.mod_attr('lstDate', tmpDate.get());
            // this.mod_attr('lstValue', tmpValue.get());
        }
    }
}
exports.SpinalLogArchiveDay = SpinalLogArchiveDay;
exports.default = SpinalLogArchiveDay;
spinal_core_connectorjs_type_1.spinalCore.register_models(SpinalLogArchiveDay);
//# sourceMappingURL=SpinalLogArchiveDay.js.map