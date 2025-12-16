export class Room {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  members: string[];

  constructor(partial: Partial<Room>) {
    Object.assign(this, partial);
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.members = this.members || [];
  }
}

