export interface ScheduleBlock {
    days: number[]; // 0-6 (Sunday-Saturday)
    startTime: string; // "09:00"
    endTime: string; // "17:00"
}

export interface YouTubeSettings {
    // Content Controls
    blockShorts: boolean;
    hideFeed: boolean;
    hideSidebar: boolean;
    hideComments: boolean;
    hideEndScreens: boolean;
    blockInfiniteScroll: boolean;

    // Time Management
    dailyLimitEnabled: boolean;
    dailyLimitMinutes: number;
    sessionWarningEnabled: boolean;
    sessionWarningMinutes: number;
    scheduleEnabled: boolean;
    scheduleBlocks: ScheduleBlock[];

    // Usage Modes
    searchOnlyMode: boolean;
    subscriptionsOnlyMode: boolean;

    // Stats
    dailyUsage: {
        [date: string]: number; // milliseconds
    };
    lastResetDate: string;
}

export const defaultSettings: YouTubeSettings = {
    // Content Controls
    blockShorts: false,
    hideFeed: false,
    hideSidebar: false,
    hideComments: false,
    hideEndScreens: false,
    blockInfiniteScroll: false,

    // Time Management
    dailyLimitEnabled: false,
    dailyLimitMinutes: 60,
    sessionWarningEnabled: false,
    sessionWarningMinutes: 30,
    scheduleEnabled: false,
    scheduleBlocks: [],

    // Usage Modes
    searchOnlyMode: false,
    subscriptionsOnlyMode: false,

    // Stats
    dailyUsage: {},
    lastResetDate: new Date().toISOString().split('T')[0]!
};

export interface BlockerSettings {
    enabled: boolean;
    blockedSites: string[];        // hostnames, e.g. ["reddit.com", "twitter.com"]
    cooldownSeconds: number;       // global cooldown duration in seconds
    gracePeriodMinutes: number;    // grace period after proceeding, in minutes
}

export const defaultBlockerSettings: BlockerSettings = {
    enabled: false,
    blockedSites: [],
    cooldownSeconds: 30,
    gracePeriodMinutes: 5,
};
