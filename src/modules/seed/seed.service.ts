import { Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from 'bcrypt';
import { UserRole } from "../users/enums/user-role.enum";

export class SeedService implements OnModuleInit{
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,         

    ){}

    async onModuleInit() {
        this.logger.log('Initialazing seeding process');
        await this.seedAdmin();
    }

    private async seedAdmin(){
        const adminEmail = this.configService.get<string>('ADMIN_SEED_EMAIL');
        const adminPassword = this.configService.get<string>('ADMIN_SEED_PASSWORD');

        if(!adminEmail || !adminPassword){
            this.logger.warn('Admin credentials are missing from the .env file. The admin seed is cancelled');
            return;
        }

        const existingAdmin = await this.userRepository.findOne({where: {email: adminEmail}});

        if(existingAdmin){
            this.logger.log('The Admin user already exists. Ommitting creation');
            return;
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

        const adminUser = this.userRepository.create({
            email: adminEmail,
            passwordHash,
            role: UserRole.ADMIN
        })

        await this.userRepository.save(adminUser);
        this.logger.log(`Admin user successfully created with the email: ${adminEmail}`);
    }
}