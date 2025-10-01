import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const adminUser = await usersService.createUserFromProfile({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Admin user created:', adminUser);
  } catch (error) {
    console.log('Admin user might already exist:', error.message);
  }

  try {
    const regularUser = await usersService.createUserFromProfile({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user'
    });
    console.log('Regular user created:', regularUser);
  } catch (error) {
    console.log('Regular user might already exist:', error.message);
  }

  await app.close();
}

seedAdmin();