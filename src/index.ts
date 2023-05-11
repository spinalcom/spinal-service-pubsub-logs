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
import {SpinalLog, SpinalLogArchive, SpinalLogArchiveDay} from './models';

import {attributeService} from 'spinal-env-viewer-plugin-documentation-service';
import {SpinalAttribute} from 'spinal-models-documentation';
import {ILog, ISpinalDateValue, ISpinalDateValueArray} from './interfaces';
import {ILogInterval} from './interfaces/ILogInterval';

export default class SpinalServiceLog {
  private spinaLogsDictionnary: Map<string, Promise<SpinalLog>>;

  constructor() {
    this.spinaLogsDictionnary = new Map();
  }

  public async pushFromEndpoint(
    node: SpinalNode,
    value: ILog
  ): Promise<boolean> {
    try {
      const log = await this.getOrCreateLog(node);
      await log.push(value);
    } catch (error) {
      return false;
    }
    return true;
  }

  public async insertFromEndpoint(
    node: SpinalNode,
    value: ILog,
    date: number | string | Date
  ): Promise<boolean> {
    try {
      const log = await this.getOrCreateLog(node);
      await log.insert(value, date);
    } catch (error) {
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
    const cfg = await this.getConfigFormEndpoint(node);
    const promise: Promise<SpinalLog> = new Promise(
      this.getOrCreateLogProm(node, cfg)
    );
    this.spinaLogsDictionnary.set(nodeId, promise);
    return promise;
  }

  private async getConfigFormEndpoint(
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
      maxDay = maxDay === null ? 2 : maxDay;
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
        maxDay: 2,
        initialBlockSize: 50,
      };
    }
  }

  private getOrCreateLogProm(
    node: SpinalNode,
    cfg: {maxDay: number; initialBlockSize: number}
  ): (
    resolve: (value: SpinalLog | PromiseLike<SpinalLog>) => void,
    reject: (reason?: any) => void
  ) => void {
    return async (resolve) => {
      const children = await node.getChildren([SpinalLog.relationName]);
      let logProm: SpinalLog | PromiseLike<SpinalLog>;
      if (children.length === 0) {
        // create element
        const spinalLog = new SpinalLog(cfg.initialBlockSize, cfg.maxDay);
        logProm = spinalLog;
        // create node
        const n = new SpinalNode('WebsocketLogs', 'Logs', spinalLog);
        n.info.add_attr(spinalLog.id.get());

        // push node to parent
        await node.addChild(
          n,
          SpinalLog.relationName,
          SPINAL_RELATION_PTR_LST_TYPE
        );
      } else {
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

  public getCurrent(spinalLog: SpinalLog): Promise<ISpinalDateValue> {
    return spinalLog.getCurrent();
  }

  public getDataFromLast24Hours(
    spinalLog: SpinalLog
  ): Promise<AsyncIterableIterator<ISpinalDateValue>> {
    return spinalLog.getDataFromLast24Hours();
  }

  public getDataFromLastHours(
    spinalLog: SpinalLog,
    numberOfHours: number = 1
  ): Promise<AsyncIterableIterator<ISpinalDateValue>> {
    return spinalLog.getDataFromLastHours(numberOfHours);
  }

  public getDataFromYesterday(
    spinalLog: SpinalLog
  ): Promise<AsyncIterableIterator<ISpinalDateValue>> {
    return spinalLog.getDataFromYesterday();
  }

  public getFromIntervalTime(
    spinalLog: SpinalLog,
    start: string | number | Date = 0,
    end: string | number | Date = Date.now()
  ): Promise<ISpinalDateValue[]> {
    return spinalLog.getFromIntervalTime(start, end);
  }

  public getFromIntervalTimeGen(
    spinalLog: SpinalLog,
    start: string | number | Date = 0,
    end: string | number | Date = Date.now()
  ): Promise<AsyncIterableIterator<ISpinalDateValue>> {
    return spinalLog.getFromIntervalTimeGen(start, end);
  }

  async getLogs(node: SpinalNode): Promise<SpinalLog> {
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

  public async getData(
    node: SpinalNode,
    logIntervalDate: ILogInterval
  ): Promise<ISpinalDateValue[]> {
    const logs = await this.getLogs(node);
    if (!logs) throw new Error('endpoint have no logs');
    return asyncGenToArray<ISpinalDateValue>(
      await this.getFromIntervalTimeGen(
        logs,
        logIntervalDate.start,
        logIntervalDate.end
      )
    );
  }

  async getCount(
    node: SpinalNode,
    logIntervalDate: ILogInterval
  ): Promise<number> {
    const data = await this.getData(node, logIntervalDate);
    return data.length;
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
