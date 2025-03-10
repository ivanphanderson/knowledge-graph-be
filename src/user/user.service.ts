import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } }) || null;
  }  

  async register(username: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { username } });

    if (existingUser) {
        throw new HttpException('Username already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({ username, password: hashedPassword });
    return this.userRepository.save(newUser);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findOne(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async getUsers() {
    return this.userRepository.find();
  }
}
