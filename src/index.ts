
import config from "./config.js";
import { Client, Collection, Options, parseEmoji, Partials } from "discord.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { RedisClientType } from "redis";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export let root = __dirname;

export class CustomClient extends Client {
    cooldowns: any[] = [];
    commands: Collection<String, any> = new Collection();
    slashCommands: Collection<String, any> = new Collection();
    selectMenus: Collection<String, any> = new Collection();
    modals: Collection<String, any> = new Collection();
    contextMenus: Collection<String, any> = new Collection();
    buttons: Collection<String, any> = new Collection();
    stateChannels: Collection<string, GuildMessageMap> = new Collection();
    autoRole: Collection<string, GuildAutoRoleMap> = new Collection(); // guildId, roleId
    redis: RedisClientType;
    constructor(options: any) {
        super(options);
        this.once("ready", async () => {
            try {
                this.application.emojis.fetch().then((e) => console.log(`Emojis loaded: ${e.size}`));
            } catch (error) {
                console.error("Error fetching emojis:", error);

            }



        })
        if (config.clearMembersCache) {
            setInterval(() => {

                // i don't need this cache, so i will clear it every 5 seconds since i can't disable it
                this.users.cache.clear();
                this.guilds.cache.forEach((guild) => {
                    guild.members.cache.clear();
                    guild.presences.cache.clear();
                    //     guild.channels.cache.clear();
                })
            }, 3000);
        };



    }
    getEmoji = (emojiName, returnBlank: boolean) => {
        const emoji = this.application.emojis.cache.find(
            (e) => e.name?.toLowerCase().trim() === emojiName?.toLowerCase().trim()
        );
        return emoji ? emoji.toString() : returnBlank ? "" : null
    };
    createEmoji = async (emojiName: string, emojiUrl: string, force: boolean = false) => {

        const emoji = this.getEmoji(emojiName, false);
        if (emoji) {
            return emoji
        } else {

            const createdEmoji = await this.application.emojis.create({
                attachment: emojiUrl,
                name: emojiName,
            });
            console.log(`Emoji ${createdEmoji.name} created`);
            return createdEmoji.toString();
        }
    };





    deleteEmoji = async (emojiName: string) => {
        const emoji = this.getEmoji(emojiName, false);
        const id = emoji && parseEmoji(emoji)?.id;
        if (emoji && id) {
            await this.application.emojis.delete(id);
            console.log(`Emoji ${emojiName} deleted`);
            return true;
        }
    }
    textValue = (key: string, value: string, noBractes: boolean = false): string => {


        return `- **${key}**: ${noBractes ? `${value}` : `\`${value}\``}\n`;
    }
    genrateUniqueId = (length: number = 16): string => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
        return result;


    }
    createEmojiWithBuffer = async (emojiName: string, buffer: Buffer, force: boolean = false) => {

        const emoji = this.getEmoji(emojiName, false);
        if (emoji) {
            return emoji
        } else {

            const createdEmoji = await this.application.emojis.create({
                attachment: buffer,
                name: emojiName,
            });
            console.log(`Emoji ${createdEmoji.name} created`);
            return createdEmoji.toString();
        }
    };






}


export const client = new CustomClient({
    intents: 33539,
    partials: [Partials.Message, Partials.GuildMember, Partials.Channel, Partials.Reaction, Partials.User, Partials.ThreadMember],
    failIfNotExists: false,
    makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
        ApplicationCommandManager: 0,
        ApplicationEmojiManager: 500,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        DMMessageManager: 25,
        EntitlementManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        GuildInviteManager: 0,
        GuildMemberManager: 100,
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        MessageManager: 100,
        PresenceManager: 500000,
        ReactionUserManager: 0,
        GuildForumThreadManager: 0,
        GuildMessageManager: 10,
        GuildTextThreadManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        UserManager: 0,
        VoiceStateManager: 0,
    }),
});


import eventHandler from "./handlers/eventHandler.js";
import idkHowToCallThisHandler from "./handlers/idkHowToCallThisHandler.js";




import mongoose from "mongoose";
import { GuildMessageMap } from "./models/stateChannel.js";
import { GuildAutoRoleMap } from "./models/autoRole.js";




(async () => {
    await idkHowToCallThisHandler.init();
    eventHandler.function();
    mongoose.connect(config.mongoDB, {
        useBigInt64: true,


    }).then(() => { console.log("Connected to MongoDB") }).catch((err) => { console.log(err) });


    client.login(config.token);

})();

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});
