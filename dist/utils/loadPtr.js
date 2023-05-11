"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPtr = void 0;
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
const spinal_core_connectorjs_type_1 = require("spinal-core-connectorjs_type");
function loadPtr(loadPtrDictionary, ptr) {
    if (typeof ptr.data.value !== 'undefined' &&
        loadPtrDictionary.has(ptr.data.value)) {
        return loadPtrDictionary.get(ptr.data.value);
    }
    if (typeof ptr.data.model !== 'undefined') {
        const res = Promise.resolve(ptr.data.model);
        if (ptr.data.value) {
            loadPtrDictionary.set(ptr.data.value, res);
        }
        return res;
    }
    if (typeof ptr.data.value !== 'undefined' && ptr.data.value === 0) {
        return Promise.reject('Load Ptr to 0');
    }
    if (typeof spinal_core_connectorjs_type_1.FileSystem._objects[ptr.data.value] !== 'undefined') {
        const res = Promise.resolve(spinal_core_connectorjs_type_1.FileSystem._objects[ptr.data.value]);
        loadPtrDictionary.set(ptr.data.value, res);
        return Promise.resolve(res);
    }
    const res = new Promise((resolve) => {
        ptr.load((element) => {
            resolve(element);
        });
    });
    loadPtrDictionary.set(ptr.data.value, res);
    return res;
}
exports.loadPtr = loadPtr;
//# sourceMappingURL=loadPtr.js.map