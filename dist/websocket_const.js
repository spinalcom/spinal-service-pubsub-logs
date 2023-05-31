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
exports.WEBSOCKET_STATE_TYPE = exports.WEBSOCKET_STATE_RELATION = exports.DISCONNECTION_EVENT = exports.CONNECTION_EVENT = exports.ALERT_EVENT = exports.RECEIVE_EVENT = exports.SEND_EVENT = exports.WEBSOCKET_STATE = void 0;
var WEBSOCKET_STATE;
(function (WEBSOCKET_STATE) {
    WEBSOCKET_STATE["running"] = "running";
    WEBSOCKET_STATE["alert"] = "alert";
    WEBSOCKET_STATE["unknow"] = "unknow";
})(WEBSOCKET_STATE = exports.WEBSOCKET_STATE || (exports.WEBSOCKET_STATE = {}));
exports.SEND_EVENT = 'send';
exports.RECEIVE_EVENT = 'receive';
exports.ALERT_EVENT = 'alert';
exports.CONNECTION_EVENT = 'connected';
exports.DISCONNECTION_EVENT = 'disconnected';
exports.WEBSOCKET_STATE_RELATION = 'hasWebsocketState';
exports.WEBSOCKET_STATE_TYPE = 'WebsocketState';
//# sourceMappingURL=websocket_const.js.map