import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PointsService } from './points.service';
import { PointWallet } from '@entities/point-wallet.entity';
import { PointTransaction } from '@entities/point-transaction.entity';
import { PointEarningPolicy } from '@entities/point-earning-policy.entity';
import { PointActionTypeEntity } from '@entities/point-action-type.entity';
import { User } from '@entities/user.entity';
import { PointActionType, PointTransactionType, PointTransactionStatus } from '@enums/point.enum';

describe('PointsService', () => {
  let service: PointsService;
  let walletRepo: jest.Mocked<Repository<PointWallet>>;
  let transactionRepo: jest.Mocked<Repository<PointTransaction>>;
  let policyRepo: jest.Mocked<Repository<PointEarningPolicy>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockWallet: Partial<PointWallet> = {
    id: 'wallet-123',
    memberId: 'user-123',
    balance: 1000,
    totalEarned: 1000,
    totalUsed: 0,
  };

  const mockPolicy: Partial<PointEarningPolicy> = {
    id: 'policy-123',
    actionType: PointActionType.WATCH,
    pointAmount: 100,
    isOneTime: false,
    isActive: true,
  };

  const mockTransaction: Partial<PointTransaction> = {
    id: 'tx-123',
    memberId: 'user-123',
    policyId: 'policy-123',
    amount: 100,
    type: PointTransactionType.EARN,
    status: PointTransactionStatus.COMPLETED,
  };

  beforeEach(async () => {
    const mockWalletRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockTransactionRepo = {
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockTransaction], 1]),
      })),
    };

    const mockPolicyRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    const mockActionTypeRepo = {
      findOne: jest.fn().mockResolvedValue({ code: 'WATCH', labelKo: '시청', isActive: true }),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PointsService,
        { provide: getRepositoryToken(PointWallet), useValue: mockWalletRepo },
        { provide: getRepositoryToken(PointTransaction), useValue: mockTransactionRepo },
        { provide: getRepositoryToken(PointEarningPolicy), useValue: mockPolicyRepo },
        { provide: getRepositoryToken(PointActionTypeEntity), useValue: mockActionTypeRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PointsService>(PointsService);
    walletRepo = module.get(getRepositoryToken(PointWallet));
    transactionRepo = module.get(getRepositoryToken(PointTransaction));
    policyRepo = module.get(getRepositoryToken(PointEarningPolicy));
    userRepo = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWallet', () => {
    it('should return existing wallet', async () => {
      walletRepo.findOne.mockResolvedValue(mockWallet as PointWallet);

      const result = await service.getWallet('user-123');

      expect(result).toEqual(mockWallet);
    });

    it('should create wallet if not exists', async () => {
      walletRepo.findOne.mockResolvedValue(null);
      walletRepo.create.mockReturnValue({ memberId: 'user-123', balance: 0 } as PointWallet);
      walletRepo.save.mockResolvedValue({ memberId: 'user-123', balance: 0 } as PointWallet);

      const result = await service.getWallet('user-123');

      expect(walletRepo.create).toHaveBeenCalled();
      expect(walletRepo.save).toHaveBeenCalled();
      expect(result.balance).toBe(0);
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      const result = await service.getTransactions('user-123', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalCount).toBe(1);
    });
  });

  describe('earn', () => {
    const validEarnDto = {
      memberId: 'user-123',
      policyId: 'policy-123',
      refType: 'challenge',
      refId: 'challenge-123',
    };

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.earn({ ...validEarnDto, memberId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if policy not found', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-123' } as User);
      policyRepo.findOne.mockResolvedValue(null);

      await expect(
        service.earn({ ...validEarnDto, policyId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should earn points successfully', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-123' } as User);
      policyRepo.findOne.mockResolvedValue(mockPolicy as PointEarningPolicy);

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockWallet),
        create: jest.fn().mockImplementation((entity, data) => data),
        save: jest.fn().mockImplementation((data) => data),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const result = await service.earn(validEarnDto);

      expect(result.newBalance).toBe(1100); // 1000 + 100
    });
  });

  describe('Policy CRUD', () => {
    describe('getPolicies', () => {
      it('should return all policies', async () => {
        policyRepo.find.mockResolvedValue([mockPolicy as PointEarningPolicy]);

        const result = await service.getPolicies();

        expect(result).toHaveLength(1);
      });
    });

    describe('findPolicyById', () => {
      it('should return policy if found', async () => {
        policyRepo.findOne.mockResolvedValue(mockPolicy as PointEarningPolicy);

        const result = await service.findPolicyById('policy-123');

        expect(result).toEqual(mockPolicy);
      });

      it('should throw NotFoundException if not found', async () => {
        policyRepo.findOne.mockResolvedValue(null);

        await expect(service.findPolicyById('non-existent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('createPolicy', () => {
      it('should create policy successfully', async () => {
        policyRepo.create.mockReturnValue(mockPolicy as PointEarningPolicy);
        policyRepo.save.mockResolvedValue(mockPolicy as PointEarningPolicy);
        // findPolicyById reload after save
        policyRepo.findOne.mockResolvedValue(mockPolicy as PointEarningPolicy);

        const result = await service.createPolicy({
          actionType: PointActionType.WATCH,
          pointAmount: 100,
        });

        expect(result.actionType).toBe(PointActionType.WATCH);
        expect(result.pointAmount).toBe(100);
      });
    });

    describe('updatePolicy', () => {
      it('should update policy successfully', async () => {
        policyRepo.findOne
          .mockResolvedValueOnce(mockPolicy as PointEarningPolicy)
          .mockResolvedValueOnce({ ...mockPolicy, pointAmount: 200 } as PointEarningPolicy);

        const result = await service.updatePolicy('policy-123', { pointAmount: 200 });

        expect(result.pointAmount).toBe(200);
      });
    });

    describe('deletePolicy', () => {
      it('should soft delete policy', async () => {
        policyRepo.findOne.mockResolvedValue(mockPolicy as PointEarningPolicy);

        await service.deletePolicy('policy-123');

        expect(policyRepo.update).toHaveBeenCalledWith('policy-123', { isActive: false });
      });
    });
  });
});
