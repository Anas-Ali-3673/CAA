import { Module, forwardRef } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}