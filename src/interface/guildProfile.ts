export interface GameActivity {
    [applicationId: string]: {
        activity_level: number;
        activity_score: number;
    };
}

export interface Trait {
    emoji_id: string | null;
    emoji_name: string | null;
    emoji_animated: boolean;
    label: string;
    position: number;
}

export interface GuildProfile {
    id: string;
    name: string;
    icon_hash: string;
    member_count: number;
    online_count: number;
    description: string;
    brand_color_primary: string;
    banner_hash: string | null;
    game_application_ids: string[];
    game_activity: GameActivity;
    tag: string;
    badge: number;
    badge_color_primary: string;
    badge_color_secondary: string;
    badge_hash: string;
    traits: Trait[];
    features: string[];
    visibility: number;
    custom_banner_hash: string;
    premium_subscription_count: number;
    premium_tier: number;
}