// Shared constants for the @mention system.
// Lives in its own module to avoid circular imports between
// MentionInputInline and MentionDropdown.

/** Sentinel user id used for the virtual "@all" mention. */
export const ALL_MENTION_USER_ID = "__mention_all__";

/** Display name of the virtual "@all" mention (chip renders as "@all"). */
export const ALL_MENTION_NAME = "all";
