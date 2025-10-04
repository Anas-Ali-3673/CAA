import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('tickets')
@UseGuards(AuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@Body() createTicketDto: CreateTicketDto, @Request() req) {
    return this.ticketsService.create(createTicketDto, req.user._id, req.user.role);
  }

  @Get()
  findAll(@Request() req) {
    console.log('Controller - req.user:', req.user);
    return this.ticketsService.findAll(req.user._id, req.user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.ticketsService.findOne(id, req.user._id, req.user.role);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto, @Request() req) {
    return this.ticketsService.update(id, updateTicketDto, req.user._id, req.user.role);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.ticketsService.remove(id, req.user._id, req.user.role);
  }
}