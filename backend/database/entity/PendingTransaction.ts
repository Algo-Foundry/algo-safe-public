import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ptxndb } from "shared/constants";

@Entity()
export class PendingTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  safe_app_id: number;

  @Column({ nullable: false })
  safe_address: string;

  @Column({ unique: true, nullable: false })
  lsig_address: string;

  @Column({ type: "text", nullable: false })
  lsig_program: string;

  @Column({ type: "simple-json", nullable: false })
  payload: string;

  @Column({ nullable: true })
  wc_id: string;

  @Column({ type: "text", nullable: true })
  rpc_id: string;

  @Column({ type: "text", nullable: true })
  initiator: string;

  @Column({ default: ptxndb.STATUS_NEW })
  execution_status: string;

  @Column({ nullable: true })
  db_seq: number;

  @Column({ type: "text", nullable: true })
  db_txnId: string;

  @Column({ nullable: true })
  db_approvers: number;

  @Column({ nullable: true })
  db_rejections: number;

  @Column({ type: "simple-json", nullable: true })
  db_votingStatus: string;

  @Column({ type: "datetime", nullable: true })
  db_expiry: Date;

  @Column({ type: "simple-json", nullable: true })
  peer_meta: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
