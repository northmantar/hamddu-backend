import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NicknameSequenceService } from './nickname-sequence.service';

describe('NicknameSequenceService', () => {
  let service: NicknameSequenceService;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NicknameSequenceService,
        {
          provide: DataSource,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NicknameSequenceService);
    dataSource = module.get(DataSource);
  });

  it('should normalize underscores to spaces when checking nickname usage', async () => {
    dataSource.query.mockResolvedValue([]);

    await service.isNicknameTaken('포근한_실뭉치');

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.any(String),
      ['포근한 실뭉치'],
    );
  });

  it('should normalize underscores to spaces when claiming a nickname', async () => {
    dataSource.query.mockResolvedValue([{ id: 'user-1' }]);

    const result = await service.claimNicknameForUser('user-1', '포근한_실뭉치');

    expect(result).toBe(true);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.any(String),
      ['포근한 실뭉치', 'user-1'],
    );
  });

  it('should return the normalized nickname after claiming with suffix handling', async () => {
    jest.spyOn(service, 'claimNicknameForUser').mockResolvedValue(true);

    const result = await service.claimNicknameWithSuffix('user-1', '포근한_실뭉치');

    expect(result).toBe('포근한 실뭉치');
    expect(service.claimNicknameForUser).toHaveBeenCalledWith('user-1', '포근한 실뭉치');
  });

  it('should allocate suffixes using the normalized base nickname', async () => {
    dataSource.query.mockResolvedValue([{ suffix: 3 }]);

    const result = await service.allocateSuffix('포근한_실뭉치');

    expect(result).toBe(3);
    expect(dataSource.query).toHaveBeenCalledWith(
      expect.any(String),
      ['포근한 실뭉치'],
    );
  });

  it('should reject nicknames that are invalid after normalization', async () => {
    await expect(service.isNicknameTaken('__')).rejects.toThrow(BadRequestException);
    expect(dataSource.query).not.toHaveBeenCalled();
  });
});
