import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Collection, SnowflakeUtil } from 'discord.js';
import { apiMember } from '../interface/user.js';
import { client } from '../index.js';
import { error } from '../utils/logging.js';

// Constants
const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const blackListedEvents = ["CHANNEL_UNREAD_UPDATE", "CONVERSATION_SUMMARY_UPDATE", "SESSIONS_REPLACE"];


interface chunkData {

    nonce: string,
    members: any[]
    guild_id: string
    chunk_index: number,
    chunk_count: number


}

interface ReadyData {
    username: string;
    discriminator: string;
    id: string;
}

export class GatewayClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private sequenceNumber: number | null = null;
    private reconnectAttempts = 0;
    private invalidSession = false;
    public ready = false;
    private onFetch = false;
    private readonly token: string;


    constructor(token: string) {
        super();

        this.token = token;
        console.log("loaded client 54")


    }

    /**
     * Send data to the WebSocket connection
     * @param data The data to send (will be automatically stringified)
     * @returns boolean indicating if the data was sent successfully
     */

    public send(data: any): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.emit('debug', 'Cannot send data - WebSocket not connected');
            return false;
        }

        try {
            const payload = typeof data === 'string' ? data : JSON.stringify(data);
            this.ws.send(payload);
            return true;
        } catch (error) {
            this.emit('error', error);
            this.emit('debug', `Failed to send data: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    public connect(): void {
        //if (this.invalidSession) return;

        this.ws = new WebSocket(GATEWAY_URL, {
            skipUTF8Validation: true,
        });

        this.setMaxListeners(50);

        this.ws.on('open', () => {
            this.emit('connected');
            this.emit('debug', '🌐 Connected to Discord Gateway');
        });

        this.ws.on('message', (data: string) => {
            try {
                const payload = JSON.parse(data.toString());
                this.handleGatewayPayload(payload);
            } catch (error) {
                this.emit('error', error);
            }
        });

        this.ws.on('close', () => {
             error('WebSocket closed unexpectedly. Attempting to reconnect...');
             setTimeout(() => this.connect(), 5000); // Reconnect after 5 seconds

        });

        this.ws.on('error', (err: Error) => {
            this.emit('error', err);
            this.emit('debug', `WebSocket error: ${err.message}`);
        });
        
    }

    private handleGatewayPayload(payload: any): void {
        const { t: eventType, s: seq, op, d } = payload;
        //if(eventType === "GUILD_MEMBERS_CHUNK") console.log(payload)

        if (blackListedEvents.includes(eventType)) return;

        if (seq !== null && seq !== undefined) {
            this.sequenceNumber = seq;
        }

        switch (op) {
            case 10: // Hello
                this.emit('debug', 'Received Hello (op 10)');
                this.startHeartbeat(d.heartbeat_interval);
                this.identify();
                break;

            case 11: // Heartbeat ACK
                this.emit('debug', 'Heartbeat acknowledged');
                break;

            case 9: // Invalid Session
                this.emit('debug', 'Invalid session. Reconnecting...');
                this.invalidSession = true;
                this.cleanup();
                break;

            case 0: // Dispatch
                if (eventType === 'READY') {
                    const readyData: ReadyData = {
                        username: d.user.username,
                        discriminator: d.user.discriminator,
                        id: d.user.id
                    };
                    this.ready = true;
                    console.log(`🎉 Logged in as ${readyData.username}#${readyData.discriminator}`)
                    this.emit('ready', readyData);
                    this.emit('debug', `🎉 Logged in as ${readyData.username}#${readyData.discriminator}`);
                }
                else if (eventType === 'GUILD_MEMBERS_CHUNK') {
                    this.emit('guildMembersChunk', d);

                }
                break;
        }
    }

    private startHeartbeat(interval: number): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.send({ op: 1, d: this.sequenceNumber })) {
                this.emit('debug', 'Sending heartbeat');
            }
        }, interval);
    }

    private identify(): void {
        const success = this.send({
            op: 2,
            d: {
                token: this.token,
                intents: 7,
                properties: {
                    os: 'Windows',
                    browser: 'Chrome',
                    device: ''
                },
            }
        });

        if (success) {
            this.emit('debug', 'Sending identify payload');
        }
    }



    public cleanup(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.ws) {
            this.ws.removeAllListeners();
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.close();
            }
            this.ws = null;
        }

        this.sequenceNumber = null;
    }
    async awaitFetchEnd(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.onFetch) {
                resolve();
                return;
            }
            const handler = () => {
                this.removeListener("FetchDone", handler);
                this.decrementMaxListeners();
                resolve();
            };
            this.incrementMaxListeners();
            this.once("FetchDone", handler);

        });
    }

    async fetchMembers(guild_id: string): Promise<Collection<string, apiMember>> {
        const fetchedMembers: Collection<string, apiMember> = new Collection();
        // if (this.onFetch) return fetchedMembers;
        return new Promise((resolve, reject) => {
            this.onFetch = true;
            const nonce = SnowflakeUtil.generate().toString();
            const limit = 0;
            const time = 60000 * 2;

            if (nonce.length > 32) throw new RangeError('MEMBER_FETCH_NONCE_LENGTH');

            this.send({
                op: 8,
                d: {
                    guild_id,
                    presences: false,
                    user_ids: [],
                    query: "",
                    nonce,
                    limit,
                },
            });

            let i = 0;
            const globalTimeout = setTimeout(() => {
                this.onFetch = false;
                this.removeListener("guildMembersChunk", handler);
                clearTimeout(timeout)
                reject(new Error('GUILD_MEMBERS_GLOBAL_TIMEOUT'));
                this.decrementMaxListeners();
            }, 60000 * 5);
            const handler = (chunk: chunkData) => {
                if (chunk.nonce !== nonce) return;

                //e console.log(`Received chunk ${i + 1} for guild ${guild_id}`);
                timeout.refresh();
                i++;

                for (const member of chunk.members) {
                    fetchedMembers.set(member.user.id, member);
                }

                if (chunk.members.length < 1_000 || (limit && fetchedMembers.size >= limit) || i === chunk.chunk_count) {
                    clearTimeout(timeout);
                    clearTimeout(globalTimeout);
                    this.removeListener("guildMembersChunk", handler);
                    this.onFetch = false;
                    this.decrementMaxListeners();

                    resolve(fetchedMembers)
                }
            };

            const timeout = setTimeout(() => {
                this.onFetch = false;
                this.removeListener("guildMembersChunk", handler);
                this.decrementMaxListeners();
                reject(new Error('GUILD_MEMBERS_TIMEOUT'));
            }, time).unref();
            this.incrementMaxListeners();
            this.on("guildMembersChunk", handler);
        });
    }


    decrementMaxListeners(): void {
        const currentListeners = this.listenerCount('guildMembersChunk');
        const wsLisetrs = this.ws?.listenerCount('guildMembersChunk') || 0;
        if (currentListeners > 0) {
            this.setMaxListeners(currentListeners - 1);

        }
        if (wsLisetrs > 0) {
            this.ws.setMaxListeners(wsLisetrs - 1);
        }

    }
    incrementMaxListeners(): void {
        const currentListeners = this.listenerCount('guildMembersChunk');
        const wsLisetrs = this.ws?.listenerCount('guildMembersChunk') || 0;
        if (currentListeners < 50) {
            this.setMaxListeners(currentListeners + 1);
        }
        if (wsLisetrs < 50) {
            this.ws.setMaxListeners(wsLisetrs + 1);
        }

    }

    public disconnect(): void {
        this.cleanup();
        this.emit('debug', 'Client manually disconnected');
    }
}