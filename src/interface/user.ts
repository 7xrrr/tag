export interface apiMember {
    avatar: string | null;
    banner: string | null;
    communication_disabled_until: string | null;
    flags: number;
    joined_at: string;
    nick: string | null;
    pending: boolean;
    premium_since: string | null;
    roles: string[];
    unusual_dm_activity_until: string | null;
    user: {
        id: string;
        username: string;
        avatar: string | null;
        discriminator: string;
        public_flags: number;
        flags: number;
        banner: string | null;
        accent_color: number | null;
        global_name: string | null;
        avatar_decoration_data: any | null;
        collectibles: {
            nameplate: {
                sku_id: string;
                asset: string;
                label: string;
                palette: string;
            };
        };
        banner_color: string | null;
        clan: {
            identity_guild_id: string;
            identity_enabled: boolean;
            tag: string;
            badge: string;
        };
        
        primary_guild: {
            identity_guild_id: string;
            identity_enabled: boolean;
            tag: string;
            badge: string;
        };
    };
}

export interface searchMember {
    member: apiMember,
    source_invite_code: string,
    join_source_type: number,
    inviter_id: string,
}

export interface membersResponse {
    guild_id: string;
    members: searchMember[],
    page_result_count: number,
    total_result_count: number


}