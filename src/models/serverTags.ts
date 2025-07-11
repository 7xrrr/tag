import { Schema, model, Document } from 'mongoose';

export interface ServerTagInterface extends Document {
    serverID: string;
    tagHash: string;
    tagName: string;
    inviteURL: string;
    memberCount: number;
    tagMembers: number;
}

interface ServerTagInterfaceDocument extends ServerTagInterface, Document { }

const ServerTagSchema = new Schema({
    serverID: {
        type: String,
        required: true,
        unique: true
    },
    tagHash: {
        type: String,
        required: false
    },
    tagName: {
        type: String,
        required: false
    },
    inviteURL: {
        type: String,
        required: false
    },
    memberCount: {
        type: Number,
        default: 0
    },
    tagMembers: {
        type: Number,
        default: 0
    },
}, {
    timestamps: true
});

const ServerTagModel = model<ServerTagInterfaceDocument>('ServerTags', ServerTagSchema);

export default ServerTagModel;