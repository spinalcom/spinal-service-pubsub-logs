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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpinalServiceLog = exports.asyncGenToArray = void 0;
const spinal_model_graph_1 = require("spinal-model-graph");
const models_1 = require("./models");
const spinal_env_viewer_plugin_documentation_service_1 = require("spinal-env-viewer-plugin-documentation-service");
class SpinalServiceLog {
    constructor() {
        this.spinaLogsDictionnary = new Map();
    }
    static getInstance() {
        if (!this._instance)
            this._instance = new SpinalServiceLog();
        return this._instance;
    }
    pushFromNode(node, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const log = yield this.getOrCreateLog(node);
                yield log.push(value);
            }
            catch (error) {
                return false;
            }
            return true;
        });
    }
    insertFromNode(node, value, date) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const log = yield this.getOrCreateLog(node);
                yield log.insert(value, date);
            }
            catch (error) {
                console.error(error);
                return false;
            }
            return true;
        });
    }
    hasLogs(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeId = node.getId().get();
            if (this.spinaLogsDictionnary.has(nodeId)) {
                return true;
            }
            const children = yield node.getChildren([models_1.SpinalLog.relationName]);
            if (children.length === 0) {
                return false;
            }
            return true;
        });
    }
    getOrCreateLog(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeId = node.getId().get();
            if (this.spinaLogsDictionnary.has(nodeId)) {
                return this.spinaLogsDictionnary.get(nodeId);
            }
            const cfg = yield this.getConfigFromNode(node);
            const promise = new Promise(this.getOrCreateLogProm(node, cfg));
            this.spinaLogsDictionnary.set(nodeId, promise);
            return promise;
        });
    }
    getConfigFromNode(node) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cat = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getCategoryByName(node, 'default');
                const attrs = yield spinal_env_viewer_plugin_documentation_service_1.attributeService.getAttributesByCategory(node, cat);
                let maxDay = null;
                let initialBlockSize = null;
                for (const attr of attrs) {
                    switch (attr.label.get()) {
                        case 'websocket log maxDay':
                            maxDay = parseInt(attr.value.get().toString());
                            break;
                        case 'websocket log initialBlockSize':
                            initialBlockSize = parseInt(attr.value.get().toString());
                            break;
                        default:
                            break;
                    }
                }
                maxDay = maxDay === null ? 14 : maxDay;
                initialBlockSize = initialBlockSize === null ? 50 : initialBlockSize;
                //
                yield spinal_env_viewer_plugin_documentation_service_1.attributeService.addAttributeByCategoryName(node, 'default', 'websocket log maxDay', maxDay.toString());
                yield spinal_env_viewer_plugin_documentation_service_1.attributeService.addAttributeByCategoryName(node, 'default', 'websocket log initialBlockSize', initialBlockSize.toString());
                return {
                    maxDay: maxDay,
                    initialBlockSize: initialBlockSize,
                };
            }
            catch (e) {
                return {
                    maxDay: 14,
                    initialBlockSize: 50,
                };
            }
        });
    }
    getOrCreateLogProm(node, cfg = {
        maxDay: 14,
        initialBlockSize: 50,
    }, createIfNotExist = true) {
        return (resolve) => __awaiter(this, void 0, void 0, function* () {
            const children = yield node.getChildren([models_1.SpinalLog.relationName]);
            let logProm;
            if (children.length === 0 && createIfNotExist) {
                // create element
                const spinalLog = new models_1.SpinalLog(cfg.initialBlockSize, cfg.maxDay);
                logProm = spinalLog;
                // create node
                const n = new spinal_model_graph_1.SpinalNode('WebsocketLogs', models_1.SpinalLog.nodeTypeName, spinalLog);
                n.info.add_attr(spinalLog.id.get());
                // push node to parent
                yield node.addChild(n, models_1.SpinalLog.relationName, spinal_model_graph_1.SPINAL_RELATION_PTR_LST_TYPE);
            }
            else if (children.length > 0) {
                const spinalLog = yield (children[0].getElement(true));
                yield spinalLog.setConfig(cfg.initialBlockSize, cfg.maxDay);
                logProm = spinalLog;
            }
            resolve(logProm);
            return logProm;
        });
    }
    getCurrent(spinalLog) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinalLog === null || spinalLog === void 0 ? void 0 : spinalLog.getCurrent();
        });
    }
    getDataFromLast24Hours(spinalLog) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinalLog === null || spinalLog === void 0 ? void 0 : spinalLog.getDataFromLast24Hours();
        });
    }
    getDataFromLastHours(spinalLog, numberOfHours = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinalLog.getDataFromLastHours(numberOfHours);
        });
    }
    getDataFromYesterday(spinalLog) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinalLog === null || spinalLog === void 0 ? void 0 : spinalLog.getDataFromYesterday();
        });
    }
    getLog(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeId = node.getId().get();
            if (this.spinaLogsDictionnary.has(nodeId)) {
                return this.spinaLogsDictionnary.get(nodeId);
            }
            const children = yield node.getChildren([models_1.SpinalLog.relationName]);
            if (children.length === 0) {
                return undefined;
            }
            const prom = children[0].getElement(true);
            this.spinaLogsDictionnary.set(nodeId, prom);
            return prom;
        });
    }
    getFromIntervalTime(spinalLog, start = 0, end = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinalLog === null || spinalLog === void 0 ? void 0 : spinalLog.getFromIntervalTime(start, end);
        });
    }
    getFromIntervalTimeGen(spinalLog, start = 0, end = Date.now()) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinalLog === null || spinalLog === void 0 ? void 0 : spinalLog.getFromIntervalTimeGen(start, end);
        });
    }
    getData(node, logIntervalDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const logs = yield this.getLog(node);
            if (!logs)
                throw new Error('node have no logs');
            return this.getFromIntervalTimeGen(logs, logIntervalDate.start, logIntervalDate.end);
        });
    }
    getCount(node, logIntervalDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData(node, logIntervalDate);
            return data.length;
        });
    }
    changeWebsocketState(spinalLog, state) {
        return __awaiter(this, void 0, void 0, function* () {
            spinalLog.setState(state);
        });
    }
    getWebsocketState(spinalLog) {
        return __awaiter(this, void 0, void 0, function* () {
            return spinalLog.getState();
        });
    }
    getDateFromLastHours(numberOfHours = 1) {
        const end = Date.now();
        const start = new Date();
        start.setUTCHours(start.getUTCHours() - numberOfHours);
        return { start, end };
    }
    getDateFromLastDays(numberOfDays = 1) {
        const end = Date.now();
        const start = new Date();
        start.setDate(start.getDate() - numberOfDays);
        return { start, end };
    }
}
exports.default = SpinalServiceLog;
exports.SpinalServiceLog = SpinalServiceLog;
function asyncGenToArray(it) {
    var it_1, it_1_1;
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const res = [];
        try {
            for (it_1 = __asyncValues(it); it_1_1 = yield it_1.next(), !it_1_1.done;) {
                const i = it_1_1.value;
                res.push(i);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (it_1_1 && !it_1_1.done && (_a = it_1.return)) yield _a.call(it_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return res;
    });
}
exports.asyncGenToArray = asyncGenToArray;
__exportStar(require("./models"), exports);
__exportStar(require("./interfaces"), exports);
__exportStar(require("./websocket_const"), exports);
//# sourceMappingURL=index.js.map