export interface AvatarDecorationData {
    asset: string;
    sku_id: string;
    expires_at: string | null;
}

export interface Nameplate {
    asset: string;
    palette?: string;
    label?: string;
    sku_id: string;
    expires_at: string | null;
}

export interface Collectibles {
    nameplate?: Nameplate;
}

export interface PrimaryGuild {
    identity_guild_id: string;
    identity_enabled: boolean;
    tag: string;
    badge: string;
}

export interface Clan {
    identity_guild_id: string;
    identity_enabled: boolean;
    tag: string;
    badge: string;
}

export interface User {
    id: string;
    username: string;
    global_name: string;
    avatar: string;
    avatar_decoration_data: AvatarDecorationData | null;
    collectibles: Collectibles | null;
    discriminator: string;
    public_flags: number;
    primary_guild: PrimaryGuild | null;
    clan: Clan | null;
}

export interface boostMember {
    id: string;
    user_id: string;
    guild_id: string;
    ended: boolean;
    pause_ends_at: string | null;
    ends_at?: string;
    user: User;
}