
import { ChatInputCommandInteraction, InteractionContextType, SlashCommandRoleOption } from "discord.js";
import ms from "ms";

import config from "../../config.js";
import { EmbedBuilder } from "../../utils/embedBuilder.js";
import GuildAutoRoleModel from "../../models/autoRole.js";
import { client } from "../../index.js";
import { log } from "../../utils/logging.js";


export default {
    name: "setrole",
    description: "guild auto role",
    permissions: [],
    roleRequired: [], // id here
    cooldown: ms("1m"), // in ms
    contexts: [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel] as InteractionContextType[],
    allowAllGuilds: true,
    allowDm: true,
    options: [
        new SlashCommandRoleOption()
            .setName("role").setRequired(true).setDescription("the role to set for the guild")
    ],
    function: async function ({ interaction }: { interaction: ChatInputCommandInteraction }) {
        if (!config.developers.includes(interaction.user.id) || !interaction.inCachedGuild() || !interaction.member.permissions.has("Administrator")) return;
        const me = await interaction.guild?.members.me.fetch();
        if (!me) return interaction.reply({ flags: ["Ephemeral"], embeds: [new EmbedBuilder().setDescription("I am not in this guild.")] });
        if (!me.permissions.has("Administrator")) return interaction.reply({ flags: ["Ephemeral"], embeds: [new EmbedBuilder().setDescription("I need the `Administrator` permission to set roles.")] });
        const role = interaction.options.getRole("role", true);
        const memberRole = interaction.member.roles.highest;
        const highestRole = me.roles.highest;
        const compare = (memberRole.comparePositionTo(role) === 1 || interaction.guild.ownerId === interaction.user.id) && highestRole.comparePositionTo(role) === 1 && !role.managed;
      /*  if (!compare) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder().setDescription("You cannot set this role as it is higher than your highest role or I cannot manage it.")
                ],
                flags: ["Ephemeral"]
            });
        }*/
        await interaction.deferReply({ flags: ["Ephemeral"] });
        await GuildAutoRoleModel.findOneAndDelete({ guildId: interaction.guild.id }).catch(() => null);
        client.autoRole.delete(interaction.guild.id); // delete the old auto role if it exists
        const newAutoRole = new GuildAutoRoleModel({
            guildId: interaction.guild.id,
            autoRole: role.id,
        });
        await newAutoRole.save().then(() => {
            client.autoRole.set(interaction.guild.id, newAutoRole); // set the new auto role
            log(`Added new auto role for guild: ${interaction.guild.id}`);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription(`Auto role has been set to <@&${role.id}>.`)
                ]
            });
        }).catch((err) => {
            console.error("Error saving auto role:", err);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder().setDescription("An error occurred while setting the auto role. Please try again later.")
                ]
            });
        });




























    }
}

