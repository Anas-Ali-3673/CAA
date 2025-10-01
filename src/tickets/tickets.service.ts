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

  private getModel(): Model<ITicket> {
    try {
      return this.primaryTicketModel;
    } catch (error) {
      return this.fallbackTicketModel;
    }
  }

  async create(createTicketDto: CreateTicketDto, userId: string, userRole: string): Promise<ITicket> {
    const model = this.getModel();
    const ticket = await model.create({
      ...createTicketDto,
      createdBy: userId,
    });

    await this.auditService.log(userId, userRole, 'CREATE', 'ticket', ticket._id.toString(), createTicketDto);
    return ticket.populate('createdBy', 'name email');
  }

  async findAll(userId: string, userRole: string): Promise<ITicket[]> {
    const model = this.getModel();
    const filter = userRole === 'admin' ? {} : { createdBy: userId };
    
    await this.auditService.log(userId, userRole, 'READ_ALL', 'ticket');
    return model.find(filter).populate('createdBy assignedTo', 'name email');
  }

  async findOne(id: string, userId: string, userRole: string): Promise<ITicket> {
    const model = this.getModel();
    const ticket = await model.findById(id).populate('createdBy assignedTo', 'name email');
    
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
    const model = this.getModel();
    const ticket = await model.findById(id);
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== 'admin' && ticket.createdBy.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updatedTicket = await model.findByIdAndUpdate(id, updateTicketDto, { new: true })
      .populate('createdBy assignedTo', 'name email');

    if (!updatedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    await this.auditService.log(userId, userRole, 'UPDATE', 'ticket', id, updateTicketDto);
    return updatedTicket;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const model = this.getModel();
    const ticket = await model.findById(id);
    
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (userRole !== 'admin' && ticket.createdBy.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }

    await model.findByIdAndDelete(id);
    await this.auditService.log(userId, userRole, 'DELETE', 'ticket', id);
  }
}