import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Delete,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CardsService } from './cards.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { MakeCardDefaultDto } from './dto/make-card-default.dto';
import { DeleteCardDto } from './dto/delete-card.dto';
import { VerifyCardDto } from './dto/verifyCard.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Cards')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @ApiOperation({ summary: 'Get user cards', description: 'Retrieve all saved payment cards for the authenticated user' })
  @ApiResponse({ status: 200, description: 'User cards returned' })
  @Get()
  async getUserCards(@Request() req) {
    const result = await this.cardsService.getUserCards(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Set default card', description: 'Set a saved card as the default payment method' })
  @ApiResponse({ status: 200, description: 'Card set as default' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @Patch()
  async makeCardDefault(@Body() makeCardDefaultDto: MakeCardDefaultDto) {
    const result = await this.cardsService.makeCardDefault(makeCardDefaultDto);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Delete card', description: 'Remove a saved payment card from the user account' })
  @ApiResponse({ status: 200, description: 'Card deleted successfully' })
  @ApiResponse({ status: 404, description: 'Card not found' })
  @Delete()
  async deleteCard(@Body() deleteCardDto: DeleteCardDto) {
    const result = await this.cardsService.removeCard(deleteCardDto.cardId);
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @ApiOperation({ summary: 'Add card', description: 'Initialize a Paystack transaction to add a new payment card. Returns authorization URL for card tokenization.' })
  @ApiResponse({ status: 200, description: 'Transaction initialized with Paystack authorization URL' })
  @HttpCode(HttpStatus.OK)
  @Header('X-Paystack-Key', <string>process.env.PAYSTACK_PUBLIC_KEY)
  @Post()
  async addCard(@Request() req) {
    const result = await this.cardsService.initializeTransaction(req.user.sub);
    return sendSuccessResponse(Messages.TRANSACTION_INITIALIZED, result);
  }

  @ApiOperation({ summary: 'Verify card transaction', description: 'Verify the Paystack card tokenization transaction and save the card to the user account' })
  @ApiResponse({ status: 200, description: 'Card verified and added to account' })
  @ApiResponse({ status: 400, description: 'Invalid or failed transaction reference' })
  @HttpCode(HttpStatus.OK)
  @Post('verify')
  async verifyTransaction(@Body() verifyCardDto: VerifyCardDto) {
    const result = await this.cardsService.verifyCard(verifyCardDto.reference);
    return sendSuccessResponse(Messages.CARD_ADDED, result);
  }
}
