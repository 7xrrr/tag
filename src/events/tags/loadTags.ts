import { serverTag } from "../../class/guildTag.js";
import { tokenUser, users } from "../../class/userManager.js";
import { client } from "../../index.js";
import GuildAutoRoleModel from "../../models/autoRole.js";
import ServerTagModel from "../../models/serverTags.js";
import GuildMessageModel from "../../models/stateChannel.js";
import tokens from "../../tokens.js";


export default {
    name: "ready",
    description: "client ready event",
    once: false,
    function: async function () {
        tokens.map(async (token) => {
            new tokenUser(token);
       })
       console.log(`Loaded ${users.size} tokens.`);
        setTimeout(async () => {
            const serverTags = await ServerTagModel.find();
            serverTags.forEach((e) => {
                new serverTag(e);
            });
            console.log(`Loaded ${serverTags.length} server tags from the database.`);
        }, 5000);

        const stateChannels = await GuildMessageModel.find();
        stateChannels.forEach((e) => {
            client.stateChannels.set(e.guildId, e);
        });
        const autoRoles = await GuildAutoRoleModel.find();
        autoRoles.forEach((e) => {
            client.autoRole.set(e.guildId, e);
        });
     

    },
} as any;
