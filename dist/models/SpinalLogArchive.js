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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalLogArchive = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const loadPtr_1 = require("../utils/loadPtr");
const SpinalLogArchiveDay_1 = require("./SpinalLogArchiveDay");
class SpinalLogArchive extends spinal_core_connectorjs_type_1.Model {
    constructor(initialBlockSize = 50) {
        super({
            initialBlockSize,
            lstDate: [],
            lstItem: [],
        });
        this.itemLoadedDictionary = new Map();
        this.loadPtrDictionary = new Map();
    }
    static normalizeDate(date) {
        return new Date(date).setUTCHours(0, 0, 0, 0);
    }
    getTodayArchive() {
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
                return (0, loadPtr_1.loadPtr)(this.loadPtrDictionary, ptr);
            }
        }
        const value = new SpinalLogArchiveDay_1.SpinalLogArchiveDay(this.initialBlockSize.get());
        this.lstDate.push(date);
        this.lstItem.push(new spinal_core_connectorjs_type_1.Ptr(value));
        const prom = Promise.resolve(value);
        this.itemLoadedDictionary.set(date, prom);
        return prom;
    }
    getOrCreateArchiveAtDate(atDate) {
        const date = SpinalLogArchive.normalizeDate(atDate);
        const spinalLogArchiveDay = this.itemLoadedDictionary.get(date);
        if (spinalLogArchiveDay !== undefined) {
            return spinalLogArchiveDay;
        }
        for (let index = 0; index < this.lstDate.length; index += 1) {
            const element = this.lstDate[index];
            const ptr = this.lstItem[index];
            if (element.get() === date) {
                return (0, loadPtr_1.loadPtr)(this.loadPtrDictionary, ptr);
            }
        }
        const value = new SpinalLogArchiveDay_1.SpinalLogArchiveDay(this.initialBlockSize.get());
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
        this.lstItem.insert(index, [new spinal_core_connectorjs_type_1.Ptr(value)]);
        const prom = Promise.resolve(value);
        this.itemLoadedDictionary.set(date, prom);
        return prom;
    }
    getFromIntervalTimeGen(start = 0, end = Date.now()) {
        return __asyncGenerator(this, arguments, function* getFromIntervalTimeGen_1() {
            const normalizedStart = SpinalLogArchive.normalizeDate(start);
            const normalizedEnd = typeof end === 'number' || typeof end === 'string'
                ? new Date(end).getTime()
                : end;
            if (!normalizedStart)
                throw new Error(`invalid date ${start}`);
            if (!normalizedEnd)
                throw new Error(`invalid date ${end}`);
            for (let idx = 0; idx < this.lstDate.length; idx += 1) {
                const element = this.lstDate[idx].get();
                if (normalizedStart > element)
                    continue;
                const archive = yield __await(this.getArchiveAtDate(element));
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
                    const dateValue = archive.get(index);
                    if (dateValue.date > normalizedEnd)
                        return yield __await(void 0);
                    yield yield __await(dateValue);
                }
            }
        });
    }
    getFromIntervalTime(start, end = Date.now()) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            try {
                for (var _b = __asyncValues(this.getFromIntervalTimeGen(start, end)), _c; _c = yield _b.next(), !_c.done;) {
                    const data = _c.value;
                    result.push(data);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return result;
        });
    }
    getArchiveAtDate(date) {
        const normalizedDate = SpinalLogArchive.normalizeDate(date);
        if (this.itemLoadedDictionary.has(normalizedDate)) {
            return this.itemLoadedDictionary.get(normalizedDate);
        }
        const idx = this.lstDate.indexOf(normalizedDate);
        if (idx < 0)
            return Promise.reject(new Error(`Date '${date}' not found.`));
        const promise = getArchive.call(this);
        this.itemLoadedDictionary.set(normalizedDate, promise);
        return promise;
        function getArchive() {
            return new Promise((resolve) => {
                const ptr = this.lstItem[idx];
                if (typeof ptr.data.model !== 'undefined') {
                    resolve(ptr.data.model);
                }
                else {
                    ptr.load((element) => {
                        resolve(element);
                    });
                }
            });
        }
    }
    getDates() {
        return this.lstDate;
    }
    dateExist(date) {
        const normalizedDate = SpinalLogArchive.normalizeDate(date);
        for (let idx = this.lstDate.length - 1; idx >= 0; idx -= 1) {
            if (this.lstDate[idx].get() === normalizedDate)
                return true;
        }
        return false;
    }
    purgeArchive(maxDay) {
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
        }
        else if (maxDay === 0) {
            this.lstDate.clear();
            this.lstItem.clear();
        }
    }
}
exports.SpinalLogArchive = SpinalLogArchive;
spinal_core_connectorjs_type_1.spinalCore.register_models(SpinalLogArchive);
exports.default = SpinalLogArchive;
//# sourceMappingURL=SpinalLogArchive.js.map