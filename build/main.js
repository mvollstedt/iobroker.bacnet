"use strict";
const BacnetStack = require('bacstack');
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
class Bacnet extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "bacnet"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
        /* BACNET WHOIS START */
        try {
            const host = (this.config && this.config.host) || '';
            let port = (this.config && this.config.port) || 47808;
            if (typeof port !== 'number') {
                const p = parseInt(port, 10);
                if (!isNaN(p)) port = p; else port = 47808;
            }
            await this.setObjectNotExistsAsync('connection.host', {type:'state', common:{name:'host', type:'string', role:'text', read:true, write:true}, native:{}});
            await this.setObjectNotExistsAsync('connection.port', {type:'state', common:{name:'port', type:'number', role:'value', read:true, write:true}, native:{}});
            await this.setStateAsync('connection.host', host || '', true);
            await this.setStateAsync('connection.port', port, true);

            if (!this.bacnetClient) {
                this.bacnetClient = new BacnetStack({adpuTimeout: 6000, port: port});
                this.log.info(`BACnet client started on UDP ${port}`);
                this._iamHandler = (data) => {
                    try {
                        const devId = data.deviceId;
                        const addr = data.address;
                        const idPrefix = `devices.${devId}`;
                        const now = Date.now();
                        this.setObjectNotExistsAsync(idPrefix, {type:'channel', common:{name:`Device ${devId}`}, native:{}});
                        this.setObjectNotExistsAsync(`${idPrefix}.address`, {type:'state', common:{name:'address', type:'string', role:'text', read:true, write:false}, native:{}});
                        this.setObjectNotExistsAsync(`${idPrefix}.deviceId`, {type:'state', common:{name:'deviceId', type:'number', role:'value', read:true, write:false}, native:{}});
                        this.setObjectNotExistsAsync(`${idPrefix}.maxApdu`, {type:'state', common:{name:'maxApdu', type:'number', role:'value', read:true, write:false}, native:{}});
                        this.setObjectNotExistsAsync(`${idPrefix}.segmentation`, {type:'state', common:{name:'segmentation', type:'string', role:'text', read:true, write:false}, native:{}});
                        this.setObjectNotExistsAsync(`${idPrefix}.vendorId`, {type:'state', common:{name:'vendorId', type:'number', role:'value', read:true, write:false}, native:{}});
                        this.setObjectNotExistsAsync(`${idPrefix}.lastSeen`, {type:'state', common:{name:'lastSeen', type:'number', role:'value.time', read:true, write:false}, native:{}});
                        this.setObjectNotExistsAsync(`${idPrefix}.present`, {type:'state', common:{name:'present', type:'boolean', role:'indicator.reachable', read:true, write:false}, native:{}});
                        this.setState(`${idPrefix}.address`, typeof addr === 'string' ? addr : JSON.stringify(addr), true);
                        this.setState(`${idPrefix}.deviceId`, devId, true);
                        if (typeof data.maxApdu !== 'undefined') this.setState(`${idPrefix}.maxApdu`, data.maxApdu, true);
                        if (typeof data.segmentation !== 'undefined') this.setState(`${idPrefix}.segmentation`, String(data.segmentation), true);
                        if (typeof data.vendorId !== 'undefined') this.setState(`${idPrefix}.vendorId`, data.vendorId, true);
                        this.setState(`${idPrefix}.lastSeen`, now, true);
                        this.setState(`${idPrefix}.present`, true, true);
                    } catch (e) {
                        this.log.warn(`I-Am handler error: ${e.message || e}`);
                    }
                };
                this.bacnetClient.on('iAm', this._iamHandler);
                // Send initial Who-Is and repeat every 60s
                this.bacnetClient.whoIs();
                this._whoisInterval = setInterval(() => {
                    try { this.bacnetClient && this.bacnetClient.whoIs(); } catch(e){ this.log.warn(`whoIs failed: ${e.message||e}`); }
                }, 60000);
            }
        } catch (e) {
            this.log.warn(`BACnet init skipped or failed: ${e.message || e}`);
        }
        /* BACNET WHOIS END */
        
        const list = Array.isArray(this.config.datapoints) ? this.config.datapoints : [];
        for (const raw of list) {
            const name = String(raw).trim();
            if (!name) continue;
            const id = `datapoints.${name.replace(/[^A-Za-z0-9_\-]/g,'_')}`;
            await this.setObjectNotExistsAsync(id, { type: 'state', common: { name, type: 'string', role: 'state', read: true, write: true }, native: {} });
        }

    this.log.info("BACnet Adapter gestartet");
    this.log.info("config option1: " + this.config.option1);
    this.log.info("config option2: " + this.config.option2);
    await this.setObjectNotExistsAsync("testVariable", {
      type: "state",
      common: {
        name: "testVariable",
        type: "boolean",
        role: "indicator",
        read: true,
        write: true
      },
      native: {}
    });
    this.subscribeStates("testVariable");
    await this.setStateAsync("testVariable", true);
    await this.setStateAsync("testVariable", { val: true, ack: true });
    await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });
    let result = await this.checkPasswordAsync("admin", "iobroker");
    this.log.info("check user admin pw iobroker: " + result);
    const isGroupCorrect = await this.checkGroupAsync("admin", "admin");
    this.log.info("check group user admin group admin: " + isGroupCorrect);
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   */
  onUnload(callback) {
    try {
      callback();
    } catch (e) {
      callback();
    }
  }
  // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
  // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
  // /**
  //  * Is called if a subscribed object changes
  //  */
  // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
  // 	if (obj) {
  // 		// The object was changed
  // 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
  // 	} else {
  // 		// The object was deleted
  // 		this.log.info(`object ${id} deleted`);
  // 	}
  // }
  /**
   * Is called if a subscribed state changes
   */
  onStateChange(id, state) {
    if (state) {
      this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
  // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
  // /**
  //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
  //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
  //  */
  // private onMessage(obj: ioBroker.Message): void {
  // 	if (typeof obj === 'object' && obj.message) {
  // 		if (obj.command === 'send') {
  // 			// e.g. send email or pushover or whatever
  // 			this.log.info('send command');
  // 			// Send response in callback if required
  // 			if (obj.callback) this.sendTo(obj.from, obj.command, 'Message received', obj.callback);
  // 		}
  // 	}
  // }
}
if (require.main !== module) {
  module.exports = (options) => new BacnetStack(options);
} else {
  (() => new BacnetStack())();
}
//# sourceMappingURL=main.js.map
