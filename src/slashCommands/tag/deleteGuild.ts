
import { ChatInputCommandInteraction, InteractionContextType, SlashCommandStringOption } from "discord.js";
import ms from "ms";

import { client } from "../../index.js";
import { serverManager } from "../../class/guildTag.js";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import config from "../../config.js";


export default {
    name: "removeguild",
    description: "Remove a guild from the bot's database.",
    permissions: [],
    roleRequired: [], // id here
    cooldown: ms("1m"), // in ms
    contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: true,
    options: [
        new SlashCommandStringOption().setName("serverid").setDescription("the server id to remove").setRequired(true)
    ],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        if (!config.developers.includes(interaction.user.id)) return;
        const serverId = interaction.options.getString("serverid", true);
        const guild = await client.guilds.fetch(serverId).catch(() => null);
        if (!guild) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(`The bot is not in the server with id \`${serverId}\`.`)
                ]
            });
        }
        const server = serverManager.getServer(serverId);
        if (!server) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(`The server with id \`${serverId}\` is not in the bot's database.`)
                ]
            });
        }
        await server.delete();
        return interaction.reply({
            embeds: [
                new EmbedBuilder().setDescription(`The server with id \`${serverId}\` has been removed from the bot's database.`)
            ]
        });






















    }
}

