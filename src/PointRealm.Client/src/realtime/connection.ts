import * as signalR from '@microsoft/signalr';

export interface ConnectionParams {
  baseUrl?: string;
  realmCode?: string;
  memberToken: string;
  clientId: string;
  debug?: boolean;
}

const DEFAULT_HUB_URL = import.meta.env.VITE_SIGNALR_HUB_URL || '/hubs/realm';

const RETRY_DELAYS = [0, 2000, 5000, 10000, 20000, 30000];

function retryDelay(attempt: number) {
  if (attempt < 0) return 0;
  if (attempt < RETRY_DELAYS.length) return RETRY_DELAYS[attempt];
  return RETRY_DELAYS[RETRY_DELAYS.length - 1];
}

export function buildConnection({
  baseUrl,
  memberToken,
  clientId,
}: ConnectionParams): signalR.HubConnection {
  const reconnectPolicy: signalR.IRetryPolicy = {
    nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
      retryDelay(previousRetryCount) ?? null,
  };

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(baseUrl || DEFAULT_HUB_URL, {
      accessTokenFactory: () => memberToken,
      headers: {
        'X-PointRealm-ClientId': clientId,
      },
      transport:
        signalR.HttpTransportType.WebSockets |
        signalR.HttpTransportType.ServerSentEvents |
        signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect(reconnectPolicy)
    .build();

  connection.serverTimeoutInMilliseconds = 60000;
  connection.keepAliveIntervalInMilliseconds = 15000;

  return connection;
}
