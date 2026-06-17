import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { XpService } from './xp.service';
import { XpWallet } from '@entities/xp-wallet.entity';
import { XpTransaction } from '@entities/xp-transaction.entity';
import { XpLevelPolicy } from '@entities/xp-level-policy.entity';
import { XpEarningPolicy } from '@entities/xp-earning-policy.entity';
import { XpActionTypeEntity } from '@entities/xp-action-type.entity';
import { User } from '@entities/user.entity';

describe('XpService', () => {
  let service: XpService;
  let walletRepo: jest.Mocked<Repository<XpWallet>>;
  let transactionRepo: jest.Mocked<Repository<XpTransaction>>;
  let policyRepo: jest.Mocked<Repository<XpLevelPolicy>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockPolicy: Partial<XpLevelPolicy> = {
    id: 'policy-123',
    level: 1,
    xpThreshold: 0,
    label: '입문자',
    isActive: true,
  };

  const mockWallet: Partial<XpWallet> = {
    id: 'wallet-123',
    memberId: 'user-123',
    policyId: 'policy-123',
    currentLevel: 1,
    totalXp: 50,
    xpToNextLevel: 50,
    policy: mockPolicy as XpLevelPolicy,
  };

  const mockTransaction: Partial<XpTransaction> = {
    id: 'tx-123',
    memberId: 'user-123',
    walletId: 'wallet-123',
    amount: 50,
  };

  beforeEach(async () => {
    const mockWalletRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockTransactionRepo = {
      findAndCount: jest.fn(),
    };

    const mockPolicyRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const mockUserRepo = {
      findOne: jest.fn(),
    };

    const mockEarningPolicyRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    const mockActionTypeRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        XpService,
        { provide: getRepositoryToken(XpWallet), useValue: mockWalletRepo },
        { provide: getRepositoryToken(XpTransaction), useValue: mockTransactionRepo },
        { provide: getRepositoryToken(XpLevelPolicy), useValue: mockPolicyRepo },
        { provide: getRepositoryToken(XpEarningPolicy), useValue: mockEarningPolicyRepo },
        { provide: getRepositoryToken(XpActionTypeEntity), useValue: mockActionTypeRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<XpService>(XpService);
    walletRepo = module.get(getRepositoryToken(XpWallet));
    transactionRepo = module.get(getRepositoryToken(XpTransaction));
    policyRepo = module.get(getRepositoryToken(XpLevelPolicy));
    userRepo = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWallet', () => {
    it('should return existing wallet with next level policy', async () => {
      walletRepo.findOne.mockResolvedValue(mockWallet as XpWallet);
      policyRepo.findOne.mockResolvedValue({ ...mockPolicy, level: 2, xpThreshold: 100 } as XpLevelPolicy);

      const result = await service.getWallet('user-123');

      expect(result.wallet).toBeDefined();
      expect(result.nextLevelPolicy).toBeDefined();
    });

    it('should create wallet if not exists', async () => {
      walletRepo.findOne.mockResolvedValue(null);
      policyRepo.findOne
        .mockResolvedValueOnce(mockPolicy as XpLevelPolicy) // level 1 policy
        .mockResolvedValueOnce({ ...mockPolicy, level: 2 } as XpLevelPolicy); // next level
      walletRepo.create.mockReturnValue(mockWallet as XpWallet);
      walletRepo.save.mockResolvedValue(mockWallet as XpWallet);

      const result = await service.getWallet('user-123');

      expect(walletRepo.create).toHaveBeenCalled();
      expect(walletRepo.save).toHaveBeenCalled();
      expect(result.wallet).toBeDefined();
    });

    it('should throw NotFoundException if no level 1 policy', async () => {
      walletRepo.findOne.mockResolvedValue(null);
      policyRepo.findOne.mockResolvedValue(null);

      await expect(service.getWallet('user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactions', () => {
    it('should return paginated transactions', async () => {
      transactionRepo.findAndCount.mockResolvedValue([[mockTransaction as XpTransaction], 1]);

      const result = await service.getTransactions('user-123', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalCount).toBe(1);
    });
  });

  describe('earn', () => {
    const validEarnDto = {
      memberId: 'user-123',
      amount: 50,
      refType: 'challenge',
      refId: 'challenge-123',
    };

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.earn({ ...validEarnDto, memberId: 'non-existent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should earn XP successfully', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-123' } as User);

      const mockManager = {
        findOne: jest.fn()
          .mockResolvedValueOnce(mockWallet) // wallet
          .mockResolvedValueOnce(mockPolicy) // newPolicy
          .mockResolvedValueOnce({ ...mockPolicy, level: 2, xpThreshold: 100 }), // nextPolicy
        create: jest.fn().mockImplementation((entity, data) => data),
        save: jest.fn().mockImplementation((data) => data),
      };

      dataSource.transaction.mockImplementation(async (cb: any) => {
        return cb(mockManager);
      });

      const result = await service.earn(validEarnDto);

      expect(result.newTotalXp).toBe(100); // 50 + 50
      expect(result.leveledUp).toBe(false);
    });
  });

  describe('Level Policy CRUD', () => {
    describe('getLevels', () => {
      it('should return active levels', async () => {
        policyRepo.find.mockResolvedValue([mockPolicy as XpLevelPolicy]);

        const result = await service.getLevels();

        expect(result).toHaveLength(1);
        expect(policyRepo.find).toHaveBeenCalledWith({
          where: { isActive: true },
          order: { level: 'ASC' },
        });
      });
    });

    describe('getAllLevels', () => {
      it('should return all levels including inactive', async () => {
        policyRepo.find.mockResolvedValue([mockPolicy as XpLevelPolicy]);

        const result = await service.getAllLevels();

        expect(result).toHaveLength(1);
        expect(policyRepo.find).toHaveBeenCalledWith({
          order: { level: 'ASC' },
        });
      });
    });

    describe('findLevelById', () => {
      it('should return level if found', async () => {
        policyRepo.findOne.mockResolvedValue(mockPolicy as XpLevelPolicy);

        const result = await service.findLevelById('policy-123');

        expect(result).toEqual(mockPolicy);
      });

      it('should throw NotFoundException if not found', async () => {
        policyRepo.findOne.mockResolvedValue(null);

        await expect(service.findLevelById('non-existent')).rejects.toThrow(NotFoundException);
      });
    });

    describe('createLevel', () => {
      it('should create level successfully', async () => {
        policyRepo.create.mockReturnValue(mockPolicy as XpLevelPolicy);
        policyRepo.save.mockResolvedValue(mockPolicy as XpLevelPolicy);

        const result = await service.createLevel({
          level: 1,
          xpThreshold: 0,
          label: '입문자',
        });

        expect(result.level).toBe(1);
        expect(result.label).toBe('입문자');
      });
    });

    describe('updateLevel', () => {
      it('should update level successfully', async () => {
        policyRepo.findOne
          .mockResolvedValueOnce(mockPolicy as XpLevelPolicy)
          .mockResolvedValueOnce({ ...mockPolicy, label: '뜨개 입문자' } as XpLevelPolicy);

        const result = await service.updateLevel('policy-123', { label: '뜨개 입문자' });

        expect(result.label).toBe('뜨개 입문자');
      });
    });

    describe('deleteLevel', () => {
      it('should soft delete level', async () => {
        policyRepo.findOne.mockResolvedValue(mockPolicy as XpLevelPolicy);

        await service.deleteLevel('policy-123');

        expect(policyRepo.update).toHaveBeenCalledWith('policy-123', { isActive: false });
      });
    });
  });
});
