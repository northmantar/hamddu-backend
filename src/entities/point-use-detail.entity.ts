import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PointTransaction } from "./point-transaction.entity";

@Entity("point_use_details")
export class PointUseDetail {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  useTxId: string;

  @ManyToOne(() => PointTransaction, (tx) => tx.useDetails)
  @JoinColumn({ name: "use_tx_id" })
  useTx: PointTransaction;

  @Column()
  earnTxId: string;

  @ManyToOne(() => PointTransaction, (tx) => tx.earnDetails)
  @JoinColumn({ name: "earn_tx_id" })
  earnTx: PointTransaction;

  @Column({ type: "int" })
  consumedAmount: number;
}
