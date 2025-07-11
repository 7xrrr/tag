export interface NameLocalizations {
    ar: string;
    bg: string;
    cs: string;
    da: string;
    de: string;
    el: string;
    fi: string;
    fr: string;
    he: string;
    hi: string;
    hr: string;
    hu: string;
    id: string;
    it: string;
    ja: string;
    ko: string;
    lt: string;
    nl: string;
    no: string;
    pl: string;
    ro: string;
    ru: string;
    th: string;
    tr: string;
    uk: string;
    vi: string;
    "en-GB": string;
    "en-US": string;
    "es-ES": string;
    "pt-BR": string;
    "sv-SE": string;
    "zh-CN": string;
    "zh-TW": string;
    "es-419": string;
}

export interface Name {
    default: string;
    localizations: NameLocalizations;
}

export interface GuildFeatures {
    features: string[];
    additional_emoji_slots: number;
    additional_sticker_slots: number;
    additional_sound_slots: number;
}

export interface PowerupMetadata {
    guild_features: GuildFeatures;
    boost_price: number;
    purchase_limit: number;
}

export interface SKU {
    id: string;
    type: number;
    product_line: number;
    dependent_sku_id: string | null;
    application_id: string;
    manifest_labels: null;
    access_type: number;
    name: Name;
    features: any[]; // Could be more specific if the structure is known
    release_date: string | null;
    premium: boolean;
    slug: string;
    flags: number;
    powerup_metadata: PowerupMetadata;
}

export interface PowerUp {
    id: string;
    sku_id: string;
    application_id: string;
    user_id: string;
    promotion_id: string | null;
    type: number;
    deleted: boolean;
    gift_code_flags: number;
    starts_at: string | null;
    ends_at: string | null;
    sku: SKU;
    guild_id: string;
    source_type: number;
}