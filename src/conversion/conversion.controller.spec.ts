import { Test, TestingModule } from '@nestjs/testing';
import { ConversionController } from './conversion.controller';
import { ConversionService } from './conversion.service';
import { ConvertCurrencyRequestDto } from './dto/convert-currency.request.dto';

describe('ConversionController', () => {
  let controller: ConversionController;
  let conversionService: ConversionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversionController],
      providers: [
        {
          provide: ConversionService,
          useValue: {
            convert: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ConversionController>(ConversionController);
    conversionService = module.get<ConversionService>(ConversionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('convert', () => {
    let body: ConvertCurrencyRequestDto;

    beforeEach(() => {
      body = {
        targetCurrencyCode: 'USD',
        sourceCurrencyCode: 'UAH',
        amount: 1000,
      };
    });

    it('should call conversionService.convert with correct params', async () => {
      await controller.convert(body);

      expect(conversionService.convert).toHaveBeenCalledWith(body.sourceCurrencyCode, body.targetCurrencyCode, body.amount);
    });

    it('should return result from conversion service', async () => {
      const mockConversionResult = {
        tgtAmount: 38300,
        conversion: 'direct',
      };
      conversionService.convert = jest.fn().mockResolvedValue(mockConversionResult);

      const result = await controller.convert(body);
      expect(result).toEqual(mockConversionResult);
    });
  });
});
