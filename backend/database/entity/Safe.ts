import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Safe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  safe_app_id: number;

  @Column({ nullable: false, unique: true })
  safe_address: string;

  @Column({ nullable: false })
  safe_name: string;

  @Column({ nullable: false })
  threshold: number;

  @Column({ nullable: false })
  master: number;

  @Column({ nullable: false })
  num_owners: number;

  @Column({ nullable: false })
  creator: string;

  @Column({ type: "simple-json", nullable: false })
  owners: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
