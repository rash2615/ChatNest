import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  createdBy: string;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'room_members',
    joinColumn: { name: 'roomId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  members: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

