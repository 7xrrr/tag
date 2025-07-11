import { Schema, model, Document } from 'mongoose';

export interface GuildAutoRoleMap extends Document {
    guildId: string;
    autoRole: string;
}

const GuildAutoRoleSchema = new Schema<GuildAutoRoleMap>({
    guildId: {
        type: String,
        required: true,
    },

    autoRole: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const GuildAutoRoleModel = model<GuildAutoRoleMap>('GuildAutoRoles', GuildAutoRoleSchema);

export default GuildAutoRoleModel;
