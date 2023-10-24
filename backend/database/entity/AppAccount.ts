import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class AppAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  address: string;

  @Column({ type: "simple-json", nullable: false })
  accounts: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
