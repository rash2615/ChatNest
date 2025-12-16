export class Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  roomId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Message>) {
    Object.assign(this, partial);
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

