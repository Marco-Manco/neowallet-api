
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { Wallet } from 'src/modules/wallets/entities/wallet.entity';
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({unique: true})
    email: string;

    @Column()
    passwordHash: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

    @OneToMany(() => Wallet, (wallet) => wallet.user)
    wallets: Wallet[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @DeleteDateColumn({name: 'deleted_at'})
    deletedAt?: Date;

    
}
