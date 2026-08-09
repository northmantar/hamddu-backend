import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FeedbacksService } from "./feedbacks.service";
import { Feedback } from "@entities/feedback.entity";

describe("FeedbacksService", () => {
  let service: FeedbacksService;
  let feedbackRepo: jest.Mocked<Repository<Feedback>>;

  beforeEach(async () => {
    const mockFeedbackRepo = {
      create: jest.fn((v) => v),
      save: jest.fn((v) => ({ id: "feedback-1", createdAt: new Date(), ...v })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbacksService,
        { provide: getRepositoryToken(Feedback), useValue: mockFeedbackRepo },
      ],
    }).compile();

    service = module.get<FeedbacksService>(FeedbacksService);
    feedbackRepo = module.get(getRepositoryToken(Feedback));
  });

  describe("create", () => {
    it("should save feedback with the author id", async () => {
      const result = await service.create("user-123", { body: "자막이 있으면 좋겠어요." });

      expect(feedbackRepo.create).toHaveBeenCalledWith({
        memberId: "user-123",
        body: "자막이 있으면 좋겠어요.",
      });
      expect(feedbackRepo.save).toHaveBeenCalled();
      expect(result.id).toBe("feedback-1");
    });

    it("should trim the body", async () => {
      await service.create("user-123", { body: "  공백 포함  " });

      expect(feedbackRepo.create).toHaveBeenCalledWith({
        memberId: "user-123",
        body: "공백 포함",
      });
    });
  });
});
