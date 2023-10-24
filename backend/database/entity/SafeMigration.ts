import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { migratesafedb } from "shared/constants";

@Entity()
export class SafeMigration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  from_safe: number;

  @Column({ nullable: true })
  to_safe: number;

  @Column({ default: migratesafedb.MIGRATE_ACTIVE })
  migrate_status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  reimbursed_amount: string;

  @Column({ nullable: true })
  reimbursed_at: Date;

  @Column({ nullable: false })
  assets_to_transfer: number;

  @Column({ nullable: true })
  transfer_algo_ptxn_id: number;
}
