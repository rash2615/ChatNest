export class Room {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: string[]; // Array of user IDs

  constructor(partial: Partial<Room>) {
    Object.assign(this, partial);
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.members = this.members || [];
  }
}

