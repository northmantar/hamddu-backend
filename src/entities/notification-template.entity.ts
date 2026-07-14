import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

/**
 * 이벤트성 알림 템플릿 (어드민 편집). 현재는 레벨업(level_up) 1종.
 * title/body 에 {level}, {label} 치환자를 쓸 수 있다.
 */
@Entity("notification_templates")
export class NotificationTemplate {
  @PrimaryColumn()
  key: string; // 'level_up'

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ default: true })
  isActive: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
