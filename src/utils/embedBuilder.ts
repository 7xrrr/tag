// file: structures/EmbedBuilder.ts
import { EmbedBuilder as DiscordEmbedBuilder } from "discord.js";
import config from "../config.js"; // adjust path to your config


export class EmbedBuilder extends DiscordEmbedBuilder {
  constructor(options?: any) {
    super(options);
    this.setColor(`#${ config.color}`); // assume config.color is a valid hex color or ColorResolvable
  }
}



