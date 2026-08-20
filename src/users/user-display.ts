import { UserStatus } from "@enums/user.enum";

export const WITHDRAWN_NAME = "탈퇴한 회원";

/** 탈퇴 회원은 닉네임이 비워지므로 작성물에는 고정 문구를 노출한다. */
export function displayNickname(user: {
  status: UserStatus;
  nickname: string | null;
}): string {
  return user.status === UserStatus.WITHDRAWN ? WITHDRAWN_NAME : (user.nickname ?? "");
}
