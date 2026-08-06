export enum ChannelPlatform {
  YOUTUBE = "youtube",
}

export enum ChannelStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

/** 채널 홈에 노출되는 외부 링크 종류 */
export enum ChannelLinkType {
  INSTAGRAM = "instagram",
  SMARTSTORE = "smartstore",
  YOUTUBE = "youtube",
  WEBSITE = "website",
  /** 위에 없는 종류. label에 표시명을 넣는다. */
  ETC = "etc",
}
