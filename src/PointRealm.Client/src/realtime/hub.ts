import * as signalR from "@microsoft/signalr";
import { getClientId } from "../lib/storage";

const HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || "/hubs/realm";

class RealmHub {
  private connection: signalR.HubConnection;
  private startedPromise: Promise<void> | null = null;

  constructor() {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
          headers: {
              'X-PointRealm-ClientId': getClientId()
          }
      })
      .withAutomaticReconnect()
      .build();

    this.connection.onclose((error: Error | undefined) => {
        console.error("SignalR connection closed", error);
        this.startedPromise = null;
    });
  }

  public async start() {
    if (!this.startedPromise) {
      this.startedPromise = this.connection.start().catch((err: unknown) => {
        console.error("Error starting SignalR connection:", err);
        this.startedPromise = null;
        throw err;
      });
    }
    return this.startedPromise;
  }

  public async stop() {
    this.startedPromise = null;
    await this.connection.stop();
  }

  public on(methodName: string, newMethod: (...args: any[]) => void) {
    this.connection.on(methodName, newMethod);
  }

  public off(methodName: string, method: (...args: any[]) => void) {
    this.connection.off(methodName, method);
  }
  
  public async invoke(methodName: string, ...args: any[]) {
      await this.start();
      return this.connection.invoke(methodName, ...args);
  }
}

export const hub = new RealmHub();
