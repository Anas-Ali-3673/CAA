import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'open', enum: ['open', 'in-progress', 'closed'] })
  status: 'open' | 'in-progress' | 'closed';

  @Prop({ default: 'medium', enum: ['low', 'medium', 'high'] })
  priority: 'low' | 'medium' | 'high';

  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  assignedTo?: Types.ObjectId;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);