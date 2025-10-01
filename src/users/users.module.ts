import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Users, UsersSchema } from "./schema/users.schema";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
    imports:[
        MongooseModule.forFeature([
            {name:Users.name,schema:UsersSchema}
        ]),
      forwardRef(() =>  AuthModule)
    ],

        providers:[UsersService],
        controllers:[UsersController],
        exports:[MongooseModule, UsersService]

})
export class UsersModule{}