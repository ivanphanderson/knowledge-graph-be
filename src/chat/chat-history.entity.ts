import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity'; 

@Entity()
export class ChatHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('text')
  message: string;

  @Column('timestamp')
  createdAt: Date;

  @Column({ type: 'enum', enum: ['user', 'chatgpt'], default: 'user' })
  senderType: 'user' | 'chatgpt';

  @Column({ default: false })
  isAddedToGraph?: boolean;
}
