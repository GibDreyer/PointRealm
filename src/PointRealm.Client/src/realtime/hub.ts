import * as signalR from "@microsoft/signalr";

const HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || "/hubs/realm";

class RealmHub {
  private connection: signalR.HubConnection | null = null;
  private startedPromise: Promise<void> | null = null;
  private currentMemberToken: string | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  public async connect(memberToken: string) {
    if (this.connection && this.currentMemberToken === memberToken && this.connection.state === signalR.HubConnectionState.Connected) {
        return;
    }

    if (this.connection) {
        await this.stop();
    }
    
    this.currentMemberToken = memberToken;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
          // Pass the JWT token via accessTokenFactory for SignalR authentication
          // The server extracts this from the query string and validates it
          accessTokenFactory: () => memberToken
      })
      .withAutomaticReconnect()
      .build();
    
    this.reattachListeners();

    this.connection.onclose((error) => {
        console.error("SignalR connection closed", error);
        this.startedPromise = null;
    });

    this.connection.onreconnecting(() => {
        console.log("SignalR reconnecting...");
    });

    this.connection.onreconnected(() => {
        console.log("SignalR reconnected");
    });

    this.startedPromise = this.connection.start().catch((err) => {
         console.error("Error starting SignalR connection:", err);
         this.startedPromise = null;
         throw err;
    });
    
    return this.startedPromise;
  }

  public async stop() {
    this.startedPromise = null;
    if (this.connection) {
        await this.connection.stop();
        this.connection = null;
    }
  }

  public on(methodName: string, newMethod: (...args: any[]) => void) {
    if (!this.listeners.has(methodName)) {
        this.listeners.set(methodName, []);
    }
    this.listeners.get(methodName)!.push(newMethod);
    
    if (this.connection) {
        this.connection.on(methodName, newMethod);
    }
  }

  public off(methodName: string, method: (...args: any[]) => void) {
    const methods = this.listeners.get(methodName);
    if (methods) {
        const index = methods.indexOf(method);
        if (index !== -1) {
            methods.splice(index, 1);
        }
    }
    if (this.connection) {
        this.connection.off(methodName, method);
    }
  }
  
  private reattachListeners() {
      if (!this.connection) return;
      this.listeners.forEach((methods, event) => {
          methods.forEach(method => {
              this.connection!.on(event, method);
          });
      });
  }
  
  public async invoke(methodName: string, ...args: any[]) {
      if (!this.connection) {
          throw new Error("Cannot invoke: Connection not started. Call connect(token) first.");
      }
      // Ensure started
      if (!this.startedPromise) {
           throw new Error("Connection exists but not started.");
      }
      await this.startedPromise;
      return this.connection.invoke(methodName, ...args);
  }
  
  public get state() {
      return this.connection?.state || signalR.HubConnectionState.Disconnected;
  }
}

export const hub = new RealmHub();
