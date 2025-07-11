import { AxiosInstance } from "axios";
import { makeAxiosInstance } from "./axiosInstance.js";
import { Collection, SnowflakeUtil } from "discord.js";
import { apiMember, membersResponse } from "../interface/user.js";
import { boostMember } from "../interface/boostMember.js";
import { GuildProfile } from "../interface/guildProfile.js";
import { GatewayClient } from "./client.js";
export const users = new Collection<string, tokenUser>();


export class userManager {

    static getUsersForGuild(guildId: string) {
        return users.filter(user => user.hasGuild(guildId) && user?.client?.ready === true)
    }
}



export class tokenUser {
    private token = null;

    private guilds: any[] = []; // Store guilds fetched by the user
    private _userId = null;
    public api: AxiosInstance = null;
    public client: GatewayClient = null; // Gateway client for the user

    constructor(token) {
        if (!token) {
            throw new Error("Token is required to create a tokenUser instance.");
        }
        this.token = token;
        this.api = makeAxiosInstance(this.token);
        users.set(this.userId, this); // Store the instance in the users map
        this.fetchGuilds();
        this.client = new GatewayClient(token);
        this.client.connect();
    }
    get userId() {
        if (this._userId) return this._userId; // Return cached userId if available
        const id = this.token.split('.')[0];
        this._userId = atob(id);
        return this._userId
    }
    async fetchGuilds() {
        const response = await this.api.get("/users/@me/guilds")
            .catch(err => {
                console.error("Failed to fetch guilds:", err);
                return { data: [] }; // Return an empty array if the request fails
            });
        if (!response || !response.data) {
            console.error("Failed to fetch guilds: No data returned");
            return [];
        }
        const ids = response.data.map(guild => guild.id);
        this.guilds = ids;
        console.log(`Fetched ${this.guilds.length} guilds for user ${this.userId}`);


        return response.data;
    }
    hasGuild(guildId: string): boolean {
        if (!this.guilds || !Array.isArray(this.guilds) || this.guilds.length === 0) {
            console.error("Guilds are not properly initialized or are not an array.");
            return false;
        }
        return this.guilds.some(guild => guild === guildId);
    }

    async fetchMembers(guildId: string): Promise<Collection<string, apiMember>> {
        return this.client.fetchMembers(guildId);
    }
    async fetchGuildTag(guildId: string) {
        if (!this.hasGuild(guildId)) {
            throw new Error(`User ${this.userId} does not have access to guild ${guildId}`);
        }
        const response = await this.api.get(`https://discord.com/api/v9/guilds/${guildId}/profile`).catch(err => { console.error(`Failed to fetch guild ${guildId}:`, err); return response.data; });

        const data: GuildProfile = response?.data;
        if (!data) return null;

        return {
            guild: data,
            hash: data?.badge_hash,
            tag: data?.tag,
        }

    }
    async fetchBoosts(guildId: string): Promise<number | null> {
        if (!this.hasGuild(guildId)) {
            throw new Error(`User ${this.userId} does not have access to guild ${guildId}`);
        }
        const response = await this.api.get(`https://discord.com/api/v9/guilds/${guildId}/premium/subscriptions`)
            .catch(err => {
                console.error(`Failed to fetch guild ${guildId}:`, err);
                return null; // Return null if the request fails
            });
        if (!response || !response.data) {
            console.error(`Failed to fetch guild ${guildId}: No data returned`);
            return null;
        }
        const data: boostMember[] = response?.data;

        return data.filter(e => !e.ends_at).length
    }



}