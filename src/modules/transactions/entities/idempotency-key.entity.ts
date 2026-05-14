import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('idempotency_keys')
@Index(['key', 'resourceType'], { unique: true })
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string;

  @Column()
  resourceType: string;

  @Column({ type: 'int' })
  responseStatus: number;

  @Column({ type: 'jsonb' })
  responseBody: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
