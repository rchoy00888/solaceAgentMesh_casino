import * as solaceModule from 'solclientjs';
const solace = (solaceModule as any).default || solaceModule;

interface SolaceConfig {
  url: string;
  vpnName: string;
  userName: string;
  password?: string;
}

export class SolaceClient {
  private static instance: SolaceClient;
  private session: any = null;
  private subscribers: Map<string, Set<(message: string) => void>> = new Map();

  private constructor() {
    const factoryProps = new solace.SolclientFactoryProperties();
    factoryProps.profile = solace.SolclientFactoryProfiles.version10;
    solace.SolclientFactory.init(factoryProps);
  }

  public static getInstance(): SolaceClient {
    if (!SolaceClient.instance) {
      SolaceClient.instance = new SolaceClient();
    }
    return SolaceClient.instance;
  }

  public connect(config: SolaceConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.session) {
        resolve();
        return;
      }

      try {
        this.session = solace.SolclientFactory.createSession({
          url: config.url,
          vpnName: config.vpnName,
          userName: config.userName,
          password: config.password,
        });

        this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
          console.log('Solace connection UP');
          resolve();
        });

        this.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (error: any) => {
          console.error('Solace connection FAILED', error);
          reject(error);
        });

        this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
          console.log('Solace disconnected');
          this.session = null;
        });

        this.session.on(solace.SessionEventCode.MESSAGE, (message: any) => {
          const topic = message.getDestination().getName();
          const payload = message.getBinaryAttachment() || message.getSdtContainer()?.toString() || '';
          
          console.log(`Received message on topic ${topic}:`, payload);
          
          const topicSubscribers = this.subscribers.get(topic);
          if (topicSubscribers) {
            topicSubscribers.forEach(cb => cb(payload));
          }
        });

        this.session.connect();
      } catch (error) {
        reject(error);
      }
    });
  }

  public subscribe(topic: string, callback: (message: string) => void) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
      if (this.session) {
        this.session.subscribe(
          solace.SolclientFactory.createTopicDestination(topic),
          true,
          topic,
          10000
        );
      }
    }
    this.subscribers.get(topic)?.add(callback);

    return () => {
      const topicSubscribers = this.subscribers.get(topic);
      if (topicSubscribers) {
        topicSubscribers.delete(callback);
        if (topicSubscribers.size === 0) {
          this.subscribers.delete(topic);
          if (this.session) {
            this.session.unsubscribe(
              solace.SolclientFactory.createTopicDestination(topic),
              true,
              topic,
              10000
            );
          }
        }
      }
    };
  }
}
