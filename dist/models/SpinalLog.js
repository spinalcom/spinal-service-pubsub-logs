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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalLog = void 0;
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
const genUID_1 = require("../utils/genUID");
const loadPtr_1 = require("../utils/loadPtr");
const SpinalLogArchive_1 = require("./SpinalLogArchive");
const websocket_const_1 = require("../websocket_const");
const __1 = require("../");
class SpinalLog extends spinal_core_connectorjs_type_1.Model {
    constructor(initialBlockSize = 50, maxDay = 2) {
        super();
        this.archiveProm = null;
        this.currentProm = null;
        this.loadPtrDictionary = new Map();
        if (spinal_core_connectorjs_type_1.FileSystem._sig_server === false)
            return;
        const archive = new SpinalLogArchive_1.SpinalLogArchive(initialBlockSize);
        this.archiveProm = Promise.resolve(archive);
        this.add_attr({
            id: (0, genUID_1.genUID)(),
            maxDay,
            archive: new spinal_core_connectorjs_type_1.Ptr(archive),
            currentArchive: new spinal_core_connectorjs_type_1.Ptr(0),
            currentData: 0,
            state: { state: websocket_const_1.WEBSOCKET_STATE.unknow, since: Date.now() },
            logTypes: new spinal_core_connectorjs_type_1.Lst([]),
            logActions: new spinal_core_connectorjs_type_1.Lst([]),
        });
    }
    setState(state) {
        this.state.since.set(Date.now());
        this.state.state.set(state);
    }
    getState() {
        return this.state.get();
    }
    getFromIntervalTimeGen(start = 0, end = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = yield this.getArchive();
            const gen = archive.getFromIntervalTimeGen(start, end);
            const list = yield (0, __1.asyncGenToArray)(gen);
            return list.map(({ date, value }) => {
                return {
                    date,
                    value: this._formatLogValue(value),
                };
            });
        });
    }
    getFromIntervalTime(start = 0, end = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = yield this.getArchive();
            const list = yield archive.getFromIntervalTime(start, end);
            return list.map(({ date, value }) => {
                return {
                    date,
                    value: this._formatLogValue(value),
                };
            });
        });
    }
    getCurrent() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.maxDay.get() === 0) {
                //@ts-ignore
                return Promise.resolve({
                    date: NaN,
                    value: NaN,
                });
            }
            let currentDay;
            try {
                currentDay = yield this.getCurrentDay();
            }
            catch (error) {
                const archive = yield this.getArchive();
                currentDay = yield archive.getTodayArchive();
            }
            const len = currentDay.length.get();
            const { date, value } = currentDay.get(len - 1);
            return { date, value: this._formatLogValue(value) };
        });
    }
    setConfig(initialBlockSize, maxDay) {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = yield this.getArchive();
            archive.initialBlockSize.set(initialBlockSize);
            if (typeof this.maxDay === 'undefined') {
                this.add_attr('maxDay', maxDay);
            }
            else
                this.maxDay.set(maxDay);
        });
    }
    push(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const valCopy = Object.assign({}, value);
            if (this.maxDay.get() === 0) {
                const archive = yield this.getArchive();
                archive.purgeArchive(this.maxDay.get());
                return;
            }
            let currentDay;
            try {
                currentDay = yield this.getCurrentDay();
            }
            catch (error) {
                const archive = yield this.getArchive();
                currentDay = yield archive.getTodayArchive();
            }
            const normalizedDate = SpinalLogArchive_1.SpinalLogArchive.normalizeDate(Date.now());
            const archive = yield this.getArchive();
            if (currentDay.dateDay.get() !== normalizedDate) {
                //const archive = await this.getArchive();
                this.currentProm = archive.getTodayArchive();
                currentDay = yield this.currentProm;
            }
            valCopy.type = this._getLogTypeIndex(value.type);
            valCopy.action = this._getLogActionIndex(value.action);
            currentDay.push(valCopy);
            archive.purgeArchive(this.maxDay.get());
        });
    }
    insert(value, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const valCopy = Object.assign({}, value);
            let currentDay;
            const archive = yield this.getArchive();
            valCopy.type = this._getLogTypeIndex(value.type);
            valCopy.action = this._getLogActionIndex(value.action);
            if (this.maxDay.get() !== 0) {
                currentDay = yield archive.getOrCreateArchiveAtDate(date);
                currentDay.insert(valCopy, date);
            }
            archive.purgeArchive(this.maxDay.get());
        });
    }
    getDataOfDay(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = yield this.getArchive();
            return archive.getArchiveAtDate(date);
        });
    }
    getArchive() {
        if (this.archiveProm !== null)
            return this.archiveProm;
        this.archiveProm = ((0, loadPtr_1.loadPtr)(this.loadPtrDictionary, this.archive));
        return this.archiveProm;
    }
    getCurrentDay() {
        if (this.currentProm !== null)
            return this.currentProm;
        this.currentProm = ((0, loadPtr_1.loadPtr)(this.loadPtrDictionary, this.currentArchive));
        return this.currentProm;
    }
    getDataFromYesterday() {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = yield this.getArchive();
            const end = new Date().setUTCHours(0, 0, 0, -1);
            const start = new Date(end).setUTCHours(0, 0, 0, 0);
            const gen = archive.getFromIntervalTimeGen(start, end);
            const list = yield (0, __1.asyncGenToArray)(gen);
            return list.map(({ date, value }) => {
                return {
                    date,
                    value: this._formatLogValue(value),
                };
            });
        });
    }
    getDataFromLast24Hours() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getDataFromLastDays(1);
        });
    }
    getDataFromLastHours(numberOfHours = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = yield this.getArchive();
            const end = Date.now();
            const start = new Date();
            start.setUTCHours(start.getUTCHours() - numberOfHours);
            const gen = archive.getFromIntervalTimeGen(start, end);
            const list = yield (0, __1.asyncGenToArray)(gen);
            return list.map(({ date, value }) => {
                return {
                    date,
                    value: this._formatLogValue(value),
                };
            });
        });
    }
    getDataFromLastDays(numberOfDays = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const archive = yield this.getArchive();
            const end = Date.now();
            const start = new Date();
            start.setDate(start.getDate() - numberOfDays);
            const gen = archive.getFromIntervalTimeGen(start, end);
            const list = yield (0, __1.asyncGenToArray)(gen);
            return list.map(({ date, value }) => {
                return {
                    date,
                    value: this._formatLogValue(value),
                };
            });
        });
    }
    _getLogTypeIndex(logType) {
        for (let i = 0; i < this.logTypes.length; i++) {
            const element = this.logTypes[i].get();
            if (element.toLowerCase() === logType.toLowerCase())
                return i;
        }
        this.logTypes.push(logType.toLowerCase());
        return this.logTypes.length - 1;
    }
    _getLogActionIndex(action) {
        for (let i = 0; i < this.logActions.length; i++) {
            const element = this.logActions[i].get();
            if (element.toLowerCase() === action.toLowerCase())
                return i;
        }
        this.logActions.push(action.toLowerCase());
        return this.logActions.length - 1;
    }
    _formatLogValue(log) {
        const obj = Object.assign({}, log);
        obj.type = this.logTypes[log.type].get();
        obj.action = this.logActions[log.action].get();
        return obj;
    }
}
exports.SpinalLog = SpinalLog;
SpinalLog.relationName = 'hasWebsocketLogs';
SpinalLog.nodeTypeName = 'SpinalLog';
spinal_core_connectorjs_type_1.spinalCore.register_models(SpinalLog);
exports.default = SpinalLog;
//# sourceMappingURL=SpinalLog.js.map