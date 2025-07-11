import cron from 'node-cron';
import { users } from '../../class/userManager.js';
import { serverManager } from '../../class/guildTag.js';
import { log } from '../../utils/logging.js';
import { client } from '../../index.js';
import { Guild, GuildChannel } from 'discord.js';
import ms from "ms";

let onFetch = false;

export default {
    name: "ready",
    description: "client ready event",
    once: false,
    function: async function () {
        cron.schedule('*/5 * * * *', async () => {
            if (onFetch) {
                console.log("🔄 Update already in progress, skipping this cycle.");
                return;
            }

            onFetch = true;
            const timeout = setTimeout(() => {
                onFetch = false;
                log("⚠️ Update timed out, reset fetch flag.");
            }, ms("10m"));

            try {
                // Fetch user guilds
                for (const user of users.values()) {
                    await user.fetchGuilds();
                }

                const servers = serverManager.getServers();
                let tokenIndex = 0;

                await Promise.all(
                    [...servers.values()].map(async (server) => {
                        if (!users.at(tokenIndex)) tokenIndex = 0;

                        const user = users.at(tokenIndex);

                        await Promise.all([
                            server.loadTag(),
                            server.checkInvite(),
                            server.fetchBoostCount(),
                            server.fetchAllMembers(user),
                        ]);

                        log(`✅ Updated server: ${server.guild?.id} — Boosts: ${server.boostCount}, Members: ${server.memberCount}`);

                        tokenIndex++;
                        if (tokenIndex >= users.size) tokenIndex = 0;
                    })
                );

                log("✅ Finished updating all servers.");

                // Update state channels
                const stateMessages = client.stateChannels.map((state) => state)
                const components = serverManager.getComponents();

                console.log(`🔄 Updating state channels for ${stateMessages.length} servers...`);

                for (const stateConfig of stateMessages) {
                    const guildId = stateConfig.guildId;
                    const guild: Guild | null = await client.guilds.fetch(guildId).catch(() => null);
                    if (!guild) {
                        console.log(`⚠️ Guild not found: ${guildId}`);
                        continue;
                    }

                    const channel: GuildChannel = await guild.channels.fetch(stateConfig.channelId).catch(() => null);
                    if (!channel || !channel.isTextBased()) {
                        console.log(`⚠️ Channel not found or not text-based: ${stateConfig.channelId} (${guild.name})`);
                        continue;
                    }

                    console.log(`🔄 Updating state channel: ${channel.name} (${guild.name})`);

                    const messages = ( await channel.messages.fetch({ limit: 100 }) )
                        .filter(msg => msg.author.id === client.user.id)
                        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                        .map(msg => msg);

                    // Update or send new messages
                    for (let i = 0; i < components.length; i++) {
                        const component = components[i];
                        const message = messages[i];

                        try {
                            if (message) {
                                await message.edit({ components: [component], flags: ["IsComponentsV2"] });
                            } else {
                                await channel.send({ components: [component], flags: ["IsComponentsV2"] });
                            }
                        } catch (err) {
                            console.error(`❌ Failed to update/send in ${guild.name}:`, err);
                        }
                    }

                    // Delete extra messages
                    for (let i = components.length; i < messages.length; i++) {
                        try {
                            await messages[i].delete();
                        } catch (err) {
                            console.error(`❌ Failed to delete message in ${guild.name}:`, err);
                        }
                    }
                }

                log("✅ Finished updating state channels.");
            } catch (err) {
                console.error("❌ Error during scheduled update:", err);
            } finally {
                clearTimeout(timeout);
                onFetch = false;
            }
        });
    },
} as any;
