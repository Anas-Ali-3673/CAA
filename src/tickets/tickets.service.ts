import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket } from './schema/ticket.schema';
import { ITicket } from './interfaces/ticket.interface';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name, 'primary') private primaryTicketModel: Model<ITicket>,
    @InjectModel(Ticket.name, 'fallback') private fallbackTicketModel: Model<ITicket>,
    private auditService: AuditService,
  ) {}

  private async writeToDatabase(operation: () => Promise<any>): Promise<any> {
    let result;
    try {
      result = await operation();
      // Try to sync to fallback
      try {
        if (result && result._id) {
          await this.fallbackTicketModel.findByIdAndUpdate(
            result._id,
            result.toObject ? result.toObject() : result,
            { upsert: true, new: true }
          );
        }
      } catch (fallbackError) {
        console.warn('Failed to sync to fallback database:', fallbackError.message);
      }
    } catch (primaryError) {
      console.warn('Primary database failed, using fallback:', primaryError.message);
      result = await operation.call(this.fallbackTicketModel);
    }
    return result;
  }

  private async readFromDatabase(operation: (model: Model<ITicket>) => Promise<any>): Promise<any> {
    try {
      return await operation(this.primaryTicketModel);
    } catch (error) {
      console.warn('Primary database failed for read, using fallback:', error.message);
      return await operation(this.fallbackTicketModel);
    }
  }

  async create(createTicketDto: CreateTicketDto, userId: string, userRole: string): Promise<ITicket> {
    const ticketData = {
      ...createTicketDto,
      createdBy: userId,
    };

    let ticket;
    try {
      // Try primary first
      ticket = await this.primaryTicketModel.create(ticketData);
      // Sync to fallback
      try {
        await this.fallbackTicketModel.create({
          _id: ticket._id,
          ...ticketData,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        });
      } catch (fallbackError) {
        console.warn('Failed to sync create to fallback:', fallbackError.message);
      }
    } catch (primaryError) {
      console.warn('Primary database failed, creating in fallback:', primaryError.message);
      ticket = await this.fallbackTicketModel.create(ticketData);
    }

    await this.auditService.log(userId, userRole, 'CREATE', 'ticket', ticket._id.toString(), createTicketDto);
    return ticket.populate('createdBy', 'name email');
  }

  async findAll(userId: string, userRole: string): Promise<ITicket[]> {
    const filter = userRole === 'admin' ? {} : { createdBy: userId };
    
    await this.auditService.log(userId, userRole, 'READ_ALL', 'ticket');
    return this.readFromDatabase(model => 
      model.find(filter).populate('createdBy assignedTo', 'name email')
    );
  }

  async findOne(id: string, userId: string, userRole: string): Promise<ITicket> {
    const ticket = await this.readFromDatabase(model => 
      model.findById(id).populate('createdBy assignedTo', 'name email')
    );
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== 'admin' && ticket.createdBy.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await this.auditService.log(userId, userRole, 'READ', 'ticket', id);
    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole: string): Promise<ITicket> {
    const ticket = await this.readFromDatabase(model => model.findById(id));
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== 'admin' && ticket.createdBy.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    let updatedTicket;
    try {
      // Update primary first
      updatedTicket = await this.primaryTicketModel.findByIdAndUpdate(id, updateTicketDto, { new: true })
        .populate('createdBy assignedTo', 'name email');
      // Sync to fallback
      try {
        await this.fallbackTicketModel.findByIdAndUpdate(id, updateTicketDto, { new: true });
      } catch (fallbackError) {
        console.warn('Failed to sync update to fallback:', fallbackError.message);
      }
    } catch (primaryError) {
      console.warn('Primary database failed, updating in fallback:', primaryError.message);
      updatedTicket = await this.fallbackTicketModel.findByIdAndUpdate(id, updateTicketDto, { new: true })
        .populate('createdBy assignedTo', 'name email');
    }

    if (!updatedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.auditService.log(userId, userRole, 'UPDATE', 'ticket', id, updateTicketDto);
    return updatedTicket;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const ticket = await this.readFromDatabase(model => model.findById(id));
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== 'admin' && ticket.createdBy.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    try {
      // Delete from primary first
      await this.primaryTicketModel.findByIdAndDelete(id);
      // Delete from fallback
      try {
        await this.fallbackTicketModel.findByIdAndDelete(id);
      } catch (fallbackError) {
        console.warn('Failed to sync delete to fallback:', fallbackError.message);
      }
    } catch (primaryError) {
      console.warn('Primary database failed, deleting from fallback:', primaryError.message);
      await this.fallbackTicketModel.findByIdAndDelete(id);
    }

    await this.auditService.log(userId, userRole, 'DELETE', 'ticket', id);
  }
}