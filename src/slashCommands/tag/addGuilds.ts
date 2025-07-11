
import { ChatInputCommandInteraction, InteractionContextType, SlashCommandStringOption } from "discord.js";
import ms from "ms";

import { client } from "../../index.js";
import { serversTag, serverTag } from "../../class/guildTag.js";
import ServerTagModel from "../../models/serverTags.js";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import config from "../../config.js";


export default {
    name: "addguild",
    description: "Add a guild to the bot's database.",
    permissions: [],
    roleRequired: [], // id here
    cooldown: ms("1m"), // in ms
    contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: true,
    options: [
        new SlashCommandStringOption().setName("serverid").setDescription("the server id to add").setRequired(true)
    ],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
          if(!config.developers.includes(interaction.user.id)) return;
        const serverId = interaction.options.getString("serverid", true);
        const guild = await client.guilds.fetch(serverId).catch(() => null);
        if (!guild) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription(`add the bot to the server with id \`${serverId}\` first.`)
                ]
            });
        };
        await interaction.deferReply({flags:["Ephemeral"]});
        const existingTag = serversTag.get(serverId);
        if (existingTag) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(`The server with id \`${serverId}\` is already added.`)
                ]
            });
        }
        const newTag = new ServerTagModel({
            serverID: serverId,
        });
        await newTag.save().then(e => {
            new serverTag(e);
            console. log(`Added new server tag for server with id: ${serverId}`);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(`Server with id \`${serverId}\` has been added successfully.`)
                ]
            });
        })
        .catch(err => {
            console.error("Error saving new server tag:", err);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(`Failed to add the server with id \`${serverId}\`. Please try again later.`)
                ]
            });
        });
        



















    }
}

