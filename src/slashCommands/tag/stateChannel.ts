
import { ChannelType, ChatInputCommandInteraction, InteractionContextType, SlashCommandChannelOption } from "discord.js";
import ms from "ms";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import GuildMessageModel from "../../models/stateChannel.js";
import { client } from "../../index.js";
import config from "../../config.js";



export default {
    name: "state",
    description: "Send a tag message to a channel.",
    permissions: [],
    roleRequired: [], // id here
    cooldown: ms("10s"), // in ms
    contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: true,
    options: [
        new SlashCommandChannelOption().setRequired(true).setName("channel").setDescription("The channel to send the tags in.")
            .addChannelTypes(ChannelType.GuildText)

    ],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        if(!config.developers.includes(interaction.user.id)) return;
        const channel = interaction.options.getChannel("channel", true);
        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                embeds: [new EmbedBuilder().setDescription("Please select a text channel.")],
                ephemeral: true
            });
        }
        await interaction.deferReply({ ephemeral: true });
        await GuildMessageModel.findOneAndDelete({ guildId: interaction.guildId })
        client.stateChannels.delete(interaction.guildId);
        const newStateChannel = new GuildMessageModel({
            guildId: interaction.guildId,
            channelId: channel.id,
        });
        await newStateChannel.save().then(() => {
            client.stateChannels.set(interaction.guildId, newStateChannel);
            console.log(`Added new state channel for guild: ${interaction.guildId}`);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(`State channel has been set to <#${channel.id}>.`)
                ]
            });
        })



    }
}

