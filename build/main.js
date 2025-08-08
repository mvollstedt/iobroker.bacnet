let BACNET_AVAILABLE = true; let BacnetLib; try { BacnetLib = require('@biancoroyal/node-bacstack'); } catch (e) { BACNET_AVAILABLE = false; }
"use strict";
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
            const port = Number((this.config && this.config.port) ?? 47808) || 47808;
            await this.setObjectNotExistsAsync('connection', { type: 'channel', common: { name: 'Connection' }, native: {} });
            await this.setObjectNotExistsAsync('connection.host', { type: 'state', common: { name: 'Host', type: 'string', role: 'text', read: true, write: false }, native: {} });
            await this.setObjectNotExistsAsync('connection.port', { type: 'state', common: { name: 'Port', type: 'number', role: 'value.port', read: true, write: false }, native: {} });
            await this.setStateAsync('connection.host', host, true);
            await this.setStateAsync('connection.port', port, true);

            if (BACNET_AVAILABLE) {
                this.bacnetClient = new BacnetLib({ port });
                this.log.info(`BACnet client gestartet (UDP ${port})`);

                this.bacnetClient.on('iAm', async (device) => {
                    try {
                        const devId = String(device.deviceId);
                        const ch = `devices.${devId}`;
                        await this.setObjectNotExistsAsync(ch, { type: 'channel', common: { name: `BACnet Device ${devId}` }, native: { deviceId: device.deviceId } });
                        const defs = [
                            ['address','string','text', device.address],
                            ['deviceId','number','value', device.deviceId],
                            ['maxApdu','number','value', device.maxApdu],
                            ['segmentation','string','text', device.segmentation],
                            ['vendorId','number','value', device.vendorId],
                            ['lastSeen','number','value.time', Date.now()],
                            ['present','boolean','indicator.reachable', true]
                        ];
                        for (const [key, type, role, initial] of defs) {
                            await this.setObjectNotExistsAsync(`${ch}.${key}`, { type: 'state', common: { name: key, type, role, read: true, write: false }, native: {} });
                            if (initial !== undefined) await this.setStateAsync(`${ch}.${key}`, initial, true);
                        }
                    } catch (e) {
                        this.log.warn('Fehler beim Verarbeiten einer I-Am-Antwort: ' + e);
                    }
                });

                try {
                    this.bacnetClient.whoIs();
                    this._whoisTimer = setInterval(() => {
                        try { this.bacnetClient && this.bacnetClient.whoIs(); } catch (e) { this.log.debug('whoIs Fehler: ' + e); }
                    }, 60000);
                } catch (e) {
                    this.log.warn('whoIs konnte nicht gesendet werden: ' + e);
                }
            } else {
                this.log.warn("BACnet-Bibliothek '@biancoroyal/node-bacstack' ist nicht installiert. Bitte ausführen: 'iobroker rebuild bacnet --install' oder im Adapterverzeichnis 'npm i @biancoroyal/node-bacstack'.");
            }
        } catch (e) {
            this.log.warn('BACnet-Initialisierung übersprungen: ' + e);
        }
/* BACNET WHOIS END */