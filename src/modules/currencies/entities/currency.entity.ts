import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CurrencyType } from "../../currencies/enums/currency-type.enum";

@Entity('currencies')
export class Currency {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({type: 'varchar', length: 10, unique: true})
    code: string;

    @Column({type: 'varchar', length: 50})
    name: string;

    @Column({type: 'varchar', length: 5, nullable: true})
    symbol: string | null;

    @Column({type: 'enum', enum: CurrencyType})
    type: CurrencyType;

    @Column({type: 'int', default: 2})
    decimals: number;
    
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
