export interface UserMapped {
    user: {
        id: string;
        primary_guild: {
            identity_guild_id?: string;
            identity_enabled?: boolean;
        };
    }
    roles: string[];
}
