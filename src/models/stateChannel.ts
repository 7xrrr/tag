import { Schema, model, Document } from 'mongoose';

export interface GuildMessageMap extends Document {
  guildId: string;
  channelId: string;
  messageIds: string[];
}

const GuildMessageSchema = new Schema<GuildMessageMap>({
  guildId: {
    type: String,
    required: true,
  },
  channelId: {
    type: String,
    required: true,
  },
  messageIds: {
    type: [String],
    default: [],
  },

}, {
  timestamps: true
});

const GuildMessageModel = model<GuildMessageMap>('GuildMessages', GuildMessageSchema);

export default GuildMessageModel;
