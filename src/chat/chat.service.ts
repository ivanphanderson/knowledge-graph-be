import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory } from './chat-history.entity';
import { User } from '../user/user.entity'; // Assuming User entity exists

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatHistoryRepository: Repository<ChatHistory>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Inject User repository
  ) {}

  // Method to save a new chat message
  async createMessage(userId: number, message: string, senderType: 'user' | 'chatgpt'): Promise<ChatHistory> {
    // Get the full User entity using userId
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    const newMessage = this.chatHistoryRepository.create({
      user, // Assign the full User entity here
      message,
      createdAt: new Date(),
      senderType, // Pass the sender type ('user' or 'chatgpt')
    });

    return await this.chatHistoryRepository.save(newMessage);
  }

  // Method to retrieve all chat history for a user
  async getChatHistory(userId: number): Promise<ChatHistory[]> {
    console.log(userId);
    return this.chatHistoryRepository.find({
      where: { user: { id: userId } }, // Use the full user object here
      order: { createdAt: 'ASC' },
    });
  }

  // Method to update (Add to graph) button visibility
  async setChatHistoryGraphState(messageId: number) {
    await this.chatHistoryRepository.update(messageId, { isAddedToGraph: true });
  }

  // Method to remove all chat history from a user
  async removeChatHistoryByUser(userId: number) {
    await this.chatHistoryRepository.delete({ user: { id: userId } });
  }
}
