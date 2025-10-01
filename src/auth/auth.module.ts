import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { Users, UsersSchema } from "src/users/schema/users.schema";
import { UsersModule } from "src/users/users.module";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PassportModule } from '@nestjs/passport';

@Module({
    imports:[
        ConfigModule,
       forwardRef(() => UsersModule),
        MongooseModule.forFeature([
            {name:Users.name,schema:UsersSchema},
        ]),
        JwtModule.registerAsync({
             imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '100y' },
      }),
      inject: [ConfigService],
        }),
        PassportModule,
    ],
    controllers:[AuthController],
    providers:[AuthService,AuthGuard],
     exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule{}