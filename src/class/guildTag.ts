import { ButtonStyle, Collection, ContainerBuilder, Guild, Role, Routes, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { apiMember } from "../interface/user.js";
import { tokenUser, userManager } from "./userManager.js";
import ServerTagModel, { ServerTagInterface } from "../models/serverTags.js";
import { client } from "../index.js";
import { renderCanvas } from "../utils/drawTag.js";
import { GuildProfile } from "../interface/guildProfile.js";
import { chunk } from "../utils/tools.js";
import config from "../config.js";
import { error, log } from "../utils/logging.js";
import { UserMapped } from "../interface/userfetch.js";

export const serversTag = new Collection<string, serverTag>();

export class serverManager {
    static getComponents() {
        const servers = serversTag.filter(e => e?.guild?.name).sort((a, b) => (b?.guildName?.length || 0) - (a?.guildName?.length || 0));
        //
        const fakeFill = config?.fakeFill || 0
        const sections = servers.reduce((p, c) => { p.push(c.buildSection()); if (fakeFill > 0) { for (let i = 0; i < fakeFill; i++) { p.push(c.buildSection()); } } return p; }, []);
        const allMembers = servers.reduce((acc, server) => acc + server.memberCount, 0);
        const allTagMembers = servers.reduce((acc, server) => acc + server.tagMembers, 0);
        const components = [];
        components.push(
            new TextDisplayBuilder()
                .setContent('## Tadfi Tag System'),
            new TextDisplayBuilder()
                .setContent(`**All Members**: ${allTagMembers}/${allMembers} members`),
            new SeparatorBuilder().setDivider(true).setSpacing(2),
            ...sections,
            new SeparatorBuilder().setDivider(true).setSpacing(2),
            new TextDisplayBuilder()
                .setContent(`**Last Update**: <t:${Math.floor(Date.now() / 1000)}:R>`),
        )
        const chukns = chunk(components, 10);
        const containers = [];
        for (const chunk of chukns) {
            const container = new ContainerBuilder({
                components: chunk,
            })
            containers.push(container);
        }
        return containers; // Return the array of containers
    };
    static getServers() {
        const guilds = client.guilds.cache;
        return serversTag.filter(server => guilds.has(server.guildId)); // Filter servers that are still in the guilds cache
    }
    static getServer(guildId: string) {
        if (!guildId) {
            throw new Error("Guild ID is required to get a server tag.");
        }
        const server = serversTag.get(guildId);


        return server;
    }
}



interface tag {
    tag: string
    hash: string;
}
export class serverTag {
    public guildId: string;
    public tag: tag = null;
    public guild: GuildProfile = null;
    public badge: string;
    public boostCount: number = 0;
    private _memberCount: number = 0;
    private _tagMembers: number = 0;
    private _otherMembers: number = 0;
    private _doc: ServerTagInterface = null; // Document for database storage
    private onSave = false;
    private onUpdate = false; // Flag to prevent multiple updates

    constructor(config: ServerTagInterface) {
        if (!config || !config.serverID) {
            throw new Error("Invalid configuration for serverTag. guildId is required.");
        }
        this.guildId = config.serverID;
        this._doc = config;
        serversTag.set(this.guildId, this); // Store the instance in the guilds map
        this.load();

    }
    async makeInviteURL() {
        const guild: Guild = await client.guilds.fetch(this.guildId).catch(() => null);

        if (!guild) {
            throw new Error(`Guild with ID ${this.guildId} not found.`);
        }
        const invite = await guild.invites.create(guild?.rulesChannelId || guild?.widgetChannelId || guild?.systemChannelId, {
            maxAge: 0,
            maxUses: 0,
            reason: "Invite created for server tag",
            unique: true,
        });
        if (!invite) {
            throw new Error(`Failed to create invite for guild ${this.guildId}`);
        }
        this._doc.inviteURL = invite.code;
        this._doc.markModified('inviteURL'); // Mark the field as modified for Mongoose
        await this._doc.save(); // Save the updated document to the database
        return this.inviteUrl;
    }
    set memberCount(count: number) {
        this._memberCount = count;
        if (this._doc.memberCount !== this._memberCount) {
            this._doc.memberCount = this._memberCount;
            this.save();
        }
    }
    get memberCount() {
        return this._memberCount;
    }
    get tagMembers() {
        return this?._tagMembers || 0;
    }
    set tagMembers(count: number) {
        this._tagMembers = count;
        if (this._doc.tagMembers !== this._tagMembers) {
            this._doc.tagMembers = this._tagMembers;
            this.save();
        }
    }

    get otherMembers() {
        return this._memberCount - this._tagMembers || 0;
    }
    set otherMembers(count: number) {
        this._otherMembers = count;

    }

    get inviteCode() {
        return this?._doc?.inviteURL
    };
    get inviteUrl() {
        if (!this.inviteCode) {
            return null
        }
        return `https://discord.gg/${this.inviteCode}`; // Return the full invite URL
    }
    async checkInvite() {
        if (!this.inviteUrl) {
            return await this.makeInviteURL();
        }
        const guild: Guild = await client.guilds.fetch(this.guildId).catch(() => null);
        const invite = guild && (await guild.invites.fetch({ cache: true })).find(e => e.code === this.inviteCode);
        if (!invite) {
            return await this.makeInviteURL(); // If invite not found, create a new one
        }
        return this.inviteUrl; // Return the existing invite URL
    }


    async load() {
        await this.loadTag();
        await this.fetchBoostCount();
        await this.checkInvite();
        this.memberCount = this?._doc?.memberCount || 0;
        this.tagMembers = this._doc.tagMembers || 0;
        this.otherMembers = this?._memberCount - this?._tagMembers || 0;
    }
    async deleteTagEmoji() {
        return await Promise.all([
            client.deleteEmoji(`${this.guildId}_1`),
            client.deleteEmoji(`${this.guildId}_2`),
        ])

    }
    async makeEmoji() {
        if (!this.tag) return;
        const [emoji1, emoji2] = await renderCanvas(this.tagIconUrl, this.tagName);
        await this.deleteTagEmoji().catch(() => null); // Delete existing emojis if any
        await Promise.all([
            client.createEmojiWithBuffer(`${this.guildId}_1`, emoji1, true),
            client.createEmojiWithBuffer(`${this.guildId}_2`, emoji2, true)
        ]);
        console.log(`Emojis created for guild ${this.guildId}: ${this.tagName}`);
    }
    getEmoji() {
        const emoji1 = client.getEmoji(`${this.guildId}_1`, false);
        const emoji2 = client.getEmoji(`${this.guildId}_2`, false);
        if (emoji1 && emoji2) {
            return `${emoji1}${emoji2}`;
        }
        else {
            this.makeEmoji().catch(console.error); // Create emojis if they don't exist
            return "";
        }

    }
    getUser() {
        const user = userManager.getUsersForGuild(this.guildId).random();
        return user ? user : null;
    }
    get tagName() {
        if (this.tag) {
            return this?.tag?.tag;
        }
        return null;
    };
    get tagHash() {
        if (this.tag) {
            return this?.tag?.hash;
        }
        return null;
    };
    get tagIconUrl() {
        return `https://cdn.discordapp.com/clan-badges/${this.guildId}/${this.tagHash}.png?size=64`
    };
    async loadTag() {
        const user = this.getUser();

        if (!user) {
            error(`No user found for guild ${this.guildId}. Cannot load tag.`);
        }
        const guild = await user.fetchGuildTag(this.guildId);



        if (guild?.tag && guild?.hash) {
            this.tag = {
                tag: guild.tag,
                hash: guild.hash
            };
            if (this.tagHash !== this?._doc?.tagHash || this.tagName !== this?._doc?.tagName) {
                this._doc.tagHash = this.tag.hash;
                this._doc.tagName = this.tag.tag;
                await this._doc.save();
                this.makeEmoji();
            }
            this.guild = guild.guild;

        }
        else {
            console.error(`Guild tag or hash not found for guild ${this.guildId}`);
            this.tag = null;
            console.log(guild)

            if (guild?.guild) this.guild = guild.guild;
        }

    }
    get guildName() {
        return this.guild?.name || null;
    }
    async fetchAllMembers(userToken: tokenUser) {
        if (!this.tagName || !userToken) return;
        let fetchedMembers = await userToken.fetchMembers(this.guildId).catch(() => new Collection<string, apiMember>());
        const members: UserMapped[] = fetchedMembers.map(e => ({
            user: {
                id: e.user.id,
                primary_guild: {
                    identity_guild_id: e.user.primary_guild?.identity_guild_id,
                    identity_enabled: e.user.primary_guild?.identity_enabled,
                },
            },
            roles: e.roles || [],
        }));
        fetchedMembers = null; // Clear the fetched members to free up memory


        let usingTag = members.filter(e => e.user?.primary_guild?.identity_guild_id === this.guildId && e?.user?.primary_guild?.identity_enabled);
        if (usingTag.length > 0) this.tagMembers = usingTag.length;
        if (members.length > 0) this.memberCount = members.length;



        this.otherMembers = this.memberCount - this.tagMembers;
        this.updateMembersRoles(members).catch(console.error);

        usingTag = null;
        return true;
    }
    async updateMembersRoles(members: UserMapped[]) {
        if (this.onUpdate) {
            members = null;
            return;
        }

        const autoRoleConfig = client.autoRole.get(this.guildId);
        if (!autoRoleConfig) return;

        const guild: Guild | null = await client.guilds.fetch(this.guildId).catch(() => null);
        if (!guild) return;

        const role: Role | null = autoRoleConfig.autoRole ? guild.roles.cache.get(autoRoleConfig.autoRole) : null;
        if (!role) return;
        this.onUpdate = true;
        let removeRoleMembers = members.filter(m => m?.user?.id && m.user?.primary_guild?.identity_guild_id !== this.guildId && m.roles.includes(role.id)).map(e => e.user.id);
        let addRoleMembers = members.filter(m => m?.user?.id && m.user?.primary_guild?.identity_guild_id === this.guildId && !m.roles.includes(role.id)).map(e => e.user.id);
        let removeSize = removeRoleMembers.length;
        let addSize = addRoleMembers.length;
        members = null;
        try {
            for (const member of removeRoleMembers) {
                try {
                    await client.rest.delete(Routes.guildMemberRole(this.guildId, member, role.id), {
                        reason: `Removing auto role ${role.name} for user ${member} in guild ${this.guildName}`
                    }),
                        console.log(`✅ Removed role ${role.name} from ${member}`);
                } catch (err) {
                    console.error(`❌ Failed to remove role ${role.name} from ${member}:`, err);
                }
            }
            removeRoleMembers = null;


            for (const member of addRoleMembers) {
                try {
                    await client.rest.put(Routes.guildMemberRole(this.guildId, member, role.id), {
                        reason: `Adding auto role ${role.name} for user ${member} in guild ${this.guildName}`
                    });
                    console.log(`✅ Added role ${role.name} to ${member}`);
                } catch (err) {
                    console.error(`❌ Failed to add role ${role.name} to ${member}:`, err);
                }
            }
            addRoleMembers = null;

            log(`🔄 Updated roles for ${this.guildName} (${this.guildId}): Added ${addSize}, Removed ${removeSize}.`);
        } catch (err) {
            console.error(`❌ Error while updating roles in ${this.guildName} (${this.guildId}):`, err);
        } finally {
            this.onUpdate = false;
            members = null;
            addRoleMembers = null
            removeRoleMembers = null;

        }
    }


    async fetchBoostCount() {
        const user = this.getUser();
        if (!user) {
            throw new Error(`No user found for guild ${this.guildId}`);
        }
        const boosts = await user.fetchBoosts(this.guildId);
        if (!boosts) {
            throw new Error(`No boosts found for guild ${this.guildId}`);
        }
        this.boostCount = boosts;
    }
    async save() {
        if (this.onSave) {
            return; // Prevent multiple saves
        }
        this.onSave = true; // Set the flag to prevent multiple saves
        setTimeout(() => {
            this._doc.save();
        }, 5000);
    }
    buildSection() {

        const emoji = this?.getEmoji();
        const tagName = this?.tagName ? this?.tagName : this.guildName
        let text = `## ${emoji ? emoji : ""} [${this.guildName}](${this.inviteUrl})\n-# `
        if (this?.tag) {
            text += `(Tag Users: ${this.tagMembers}/${this.memberCount})`
        }
        console.log(this.boostCount)
        if (this.boostCount < 3) {
            console.log("true")
            if (!this.tag) text += `**\`${3 - this.boostCount}\`** boosts remaining to enable the **\`Server Tag\`** perk ${client.getEmoji("warn", true)}`;
            else text += `[${this.boostCount}/3] ${client.getEmoji("warn", true)}`
            console.log(text)
        }
        const section = new SectionBuilder()
            .addTextDisplayComponents(
                textDisplay => textDisplay

                    .setContent(text),
            )
            .setButtonAccessory(
                button => button
                    .setLabel(`Join ${tagName}`)
                    .setURL(`${this.inviteUrl}`)
                    .setStyle(ButtonStyle.Link),
            );
        return section;

    }
    async delete() {
        return await ServerTagModel.findByIdAndDelete(this._doc._id)
            .then(() => {
                serversTag.delete(this.guildId); // Remove from the collection
                console.log(`Server tag deleted for guild ${this.guildId}`);
                return true
            })
            .catch(err => {
                console.error(`Failed to delete server tag for guild ${this.guildId}:`, err);
                return false;
            });
    }

}