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

import {SPINAL_RELATION_PTR_LST_TYPE, SpinalNode} from 'spinal-model-graph';
import {SpinalLog} from './models';

import {attributeService} from 'spinal-env-viewer-plugin-documentation-service';
import {SpinalAttribute} from 'spinal-models-documentation';
import {ILog, ISpinalDateValue} from './interfaces';
import {ILogInterval} from './interfaces/ILogInterval';
import {WEBSOCKET_STATE} from './websocket_const';

export default class SpinalServiceLog {
  private spinaLogsDictionnary: Map<string, Promise<SpinalLog>>;
  private static _instance: SpinalServiceLog;

  constructor() {
    this.spinaLogsDictionnary = new Map();
  }

  public static getInstance(): SpinalServiceLog {
    if (!this._instance) this._instance = new SpinalServiceLog();

    return this._instance;
  }

  public async pushFromNode(node: SpinalNode, value: ILog): Promise<boolean> {
    try {
      const log = await this.getOrCreateLog(node);
      await log.push(value);
    } catch (error) {
      return false;
    }
    return true;
  }

  public async insertFromNode(
    node: SpinalNode,
    value: ILog,
    date: number | string | Date
  ): Promise<boolean> {
    try {
      const log = await this.getOrCreateLog(node);
      await log.insert(value, date);
    } catch (error) {
      console.error(error);
      return false;
    }
    return true;
  }

  public async hasLogs(node: SpinalNode): Promise<boolean> {
    const nodeId = node.getId().get();
    if (this.spinaLogsDictionnary.has(nodeId)) {
      return true;
    }
    const children = await node.getChildren([SpinalLog.relationName]);
    if (children.length === 0) {
      return false;
    }
    return true;
  }

  public async getOrCreateLog(node: SpinalNode): Promise<SpinalLog> {
    const nodeId = node.getId().get();
    if (this.spinaLogsDictionnary.has(nodeId)) {
      return this.spinaLogsDictionnary.get(nodeId);
    }
    const cfg = await this.getConfigFromNode(node);
    const promise: Promise<SpinalLog> = new Promise(
      this.getOrCreateLogProm(node, cfg)
    );
    this.spinaLogsDictionnary.set(nodeId, promise);
    return promise;
  }

  private async getConfigFromNode(
    node: SpinalNode
  ): Promise<{maxDay: number; initialBlockSize: number}> {
    try {
      const cat = await attributeService.getCategoryByName(node, 'default');

      const attrs: SpinalAttribute[] =
        await attributeService.getAttributesByCategory(node, cat);
      let maxDay: number = null;
      let initialBlockSize: number = null;
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
      await attributeService.addAttributeByCategoryName(
        node,
        'default',
        'websocket log maxDay',
        maxDay.toString()
      );
      await attributeService.addAttributeByCategoryName(
        node,
        'default',
        'websocket log initialBlockSize',
        initialBlockSize.toString()
      );

      return {
        maxDay: maxDay,
        initialBlockSize: initialBlockSize,
      };
    } catch (e) {
      return {
        maxDay: 14,
        initialBlockSize: 50,
      };
    }
  }

  private getOrCreateLogProm(
    node: SpinalNode,
    cfg: {maxDay: number; initialBlockSize: number} = {
      maxDay: 14,
      initialBlockSize: 50,
    },
    createIfNotExist: boolean = true
  ): (
    resolve: (value: SpinalLog | PromiseLike<SpinalLog>) => void,
    reject: (reason?: any) => void
  ) => void {
    return async (resolve) => {
      const children = await node.getChildren([SpinalLog.relationName]);
      let logProm: SpinalLog | PromiseLike<SpinalLog>;
      if (children.length === 0 && createIfNotExist) {
        // create element
        const spinalLog = new SpinalLog(cfg.initialBlockSize, cfg.maxDay);
        logProm = spinalLog;
        // create node
        const n = new SpinalNode(
          'WebsocketLogs',
          SpinalLog.nodeTypeName,
          spinalLog
        );
        n.info.add_attr(spinalLog.id.get());

        // push node to parent
        await node.addChild(
          n,
          SpinalLog.relationName,
          SPINAL_RELATION_PTR_LST_TYPE
        );
      } else if (children.length > 0) {
        const spinalLog = await (<Promise<SpinalLog>>(
          children[0].getElement(true)
        ));
        await spinalLog.setConfig(cfg.initialBlockSize, cfg.maxDay);
        logProm = spinalLog;
      }
      resolve(logProm);
      return logProm;
    };
  }

  public async getCurrent(spinalLog: SpinalLog): Promise<ISpinalDateValue> {
    return spinalLog?.getCurrent();
  }

  public async getDataFromLast24Hours(
    spinalLog: SpinalLog
  ): Promise<ISpinalDateValue[]> {
    return spinalLog?.getDataFromLast24Hours();
  }

  public async getDataFromLastHours(
    spinalLog: SpinalLog,
    numberOfHours: number = 1
  ): Promise<ISpinalDateValue[]> {
    return spinalLog.getDataFromLastHours(numberOfHours);
  }

  public async getDataFromYesterday(
    spinalLog: SpinalLog
  ): Promise<ISpinalDateValue[]> {
    return spinalLog?.getDataFromYesterday();
  }

  async getLog(node: SpinalNode): Promise<SpinalLog> {
    const nodeId = node.getId().get();
    if (this.spinaLogsDictionnary.has(nodeId)) {
      return this.spinaLogsDictionnary.get(nodeId);
    }
    const children = await node.getChildren([SpinalLog.relationName]);
    if (children.length === 0) {
      return undefined;
    }
    const prom = <Promise<SpinalLog>>children[0].getElement(true);
    this.spinaLogsDictionnary.set(nodeId, prom);
    return prom;
  }

  public async getFromIntervalTime(
    spinalLog: SpinalLog,
    start: string | number | Date = 0,
    end: string | number | Date = Date.now()
  ): Promise<ISpinalDateValue[]> {
    return spinalLog?.getFromIntervalTime(start, end);
  }

  public async getFromIntervalTimeGen(
    spinalLog: SpinalLog,
    start: string | number | Date = 0,
    end: string | number | Date = Date.now()
  ): Promise<ISpinalDateValue[]> {
    return spinalLog?.getFromIntervalTimeGen(start, end);
  }

  public async getData(
    node: SpinalNode,
    logIntervalDate: ILogInterval
  ): Promise<ISpinalDateValue[]> {
    const logs = await this.getLog(node);
    if (!logs) throw new Error('node have no logs');
    return this.getFromIntervalTimeGen(
      logs,
      logIntervalDate.start,
      logIntervalDate.end
    );
  }

  public async getCount(
    node: SpinalNode,
    logIntervalDate: ILogInterval
  ): Promise<number> {
    const data = await this.getData(node, logIntervalDate);
    return data.length;
  }

  public async changeWebsocketState(
    spinalLog: SpinalLog,
    state: WEBSOCKET_STATE
  ) {
    spinalLog.setState(state);
  }

  public async getWebsocketState(spinalLog: SpinalLog) {
    return spinalLog.getState();
  }

  public getDateFromLastHours(numberOfHours: number = 1): ILogInterval {
    const end = Date.now();
    const start = new Date();
    start.setUTCHours(start.getUTCHours() - numberOfHours);
    return {start, end};
  }

  public getDateFromLastDays(numberOfDays: number = 1): ILogInterval {
    const end = Date.now();
    const start = new Date();
    start.setDate(start.getDate() - numberOfDays);
    return {start, end};
  }
}

async function asyncGenToArray<T>(it: AsyncIterableIterator<T>): Promise<T[]> {
  const res: T[] = [];
  for await (const i of it) {
    res.push(i);
  }
  return res;
}

export {asyncGenToArray, SpinalServiceLog};
export * from './models';
export * from './interfaces';
export * from './websocket_const';
