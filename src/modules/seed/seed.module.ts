import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../users/entities/user.entity";
import { SeedService } from "./seed.service";
import { Currency } from "../currencies/entities/currency.entity";

@Module({
    imports: [TypeOrmModule.forFeature([User, Currency])],
    providers: [SeedService],
})
export class SeedModule{}