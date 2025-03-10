export class CreateMessageDto {
    userId: number;
    message: string;
    senderType: 'user' | 'chatgpt'; 
  }