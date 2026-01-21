import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ArgumentsHost } from "@nestjs/common/interfaces";
import { type Request } from "express";
import {
  MessageRole,
  ContentPartType,
  GenerationStage,
} from "@tambo-ai-cloud/core";
import { SentryExceptionFilter } from "../../common/filters/sentry-exception.filter";
import { ThreadsController } from "../threads.controller";
import { ThreadMessageDto } from "../dto/message.dto";
import { extractContextInfo } from "../../common/utils/extract-context-info";

jest.mock("../../common/utils/extract-context-info");
const mockExtractContextInfo = extractContextInfo as jest.MockedFunction<
  typeof extractContextInfo
>;

function createHttpHost(req: Partial<Request>, res: any): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
    getArgs: () => [req, res],
    getArgByIndex: (index: number) => (index === 0 ? req : res),
    switchToRpc: () => ({ getContext: () => undefined }),
    switchToWs: () => ({ getClient: () => undefined }),
    getType: () => "http",
  } as unknown as ArgumentsHost;
}

describe("ThreadsController HTTP response handling without network sockets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("SentryExceptionFilter JSON formatting", () => {
    const req: Partial<Request> = {
      method: "POST",
      url: "/threads/advancestream",
      headers: {},
      query: {},
      params: {},
      body: {},
    };
    let replySpy: jest.Mock;
    let filter: SentryExceptionFilter;

    beforeEach(() => {
      replySpy = jest.fn();
      const mockHttpAdapter = {
        reply: replySpy,
        isHeadersSent: jest.fn().mockReturnValue(false),
        end: jest.fn(),
      } as unknown as ConstructorParameters<typeof SentryExceptionFilter>[0];
      filter = new SentryExceptionFilter(mockHttpAdapter);
    });

    it("should return default Nest-style JSON for createAndAdvanceThreadStream errors", () => {
      const res = {};
      const host = createHttpHost(req, res);
      const exception = new BadRequestException(
        "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
      );

      filter.catch(exception, host);

      expect(replySpy).toHaveBeenCalledWith(
        res,
        {
          statusCode: 400,
          message:
            "Context key cannot be provided both via API parameter and OAuth bearer token. Use only one method.",
          error: "Bad Request",
        },
        400,
      );
    });

    it("should return default Nest-style JSON for BadRequestException", () => {
      const res = {};
      const host = createHttpHost(req, res);
      const exception = new BadRequestException("Any validation error");

      filter.catch(exception, host);

      expect(replySpy).toHaveBeenCalledWith(
        res,
        {
          statusCode: 400,
          message: "Any validation error",
          error: "Bad Request",
        },
        400,
      );
    });
  });

  describe("ThreadsController streaming responses", () => {
    it("should stream SSE payloads when queue produces messages", async () => {
      const controller = new ThreadsController({} as any);
      const chunks: string[] = [];
      const response = {
        write: jest.fn((value: string) => {
          chunks.push(value);
        }),
        end: jest.fn(),
      };

      async function* stream() {
        yield {
          response: {
            responseMessageDto: {
              id: "msg-1",
              threadId: "thread-1",
              role: MessageRole.Assistant,
              content: [{ type: ContentPartType.Text, text: "Hello" }],
              componentState: {},
              createdAt: new Date(),
            } as ThreadMessageDto,
            generationStage: GenerationStage.COMPLETE,
          },
          aguiEvents: [],
        };
      }

      await (controller as any).handleAdvanceStream(response, stream(), false);

      expect(chunks).toHaveLength(2);
      const payload = JSON.parse(chunks[0].replace("data: ", ""));
      expect(payload.responseMessageDto).toMatchObject({ id: "msg-1" });
      expect(payload.generationStage).toBe(GenerationStage.COMPLETE);
      expect(chunks[1]).toBe("data: DONE\n\n");
      expect(response.end).toHaveBeenCalled();
    });

    it("should surface streaming errors as InternalServerErrorException", async () => {
      const threadsService = {
        advanceThread: jest.fn().mockRejectedValue(new Error("stream failure")),
      };
      const controller = new ThreadsController(threadsService as any);
      jest
        .spyOn(controller as any, "handleAdvanceStream")
        .mockResolvedValue(undefined);
      mockExtractContextInfo.mockReturnValue({
        projectId: "test-project",
        contextKey: "test-context",
      });
      await expect(
        controller.createAndAdvanceThreadStream(
          {} as Request,
          {
            messageToAppend: {
              content: [{ type: ContentPartType.Text, text: "test" }],
              role: MessageRole.User,
            },
          } as any,
          {
            setHeader: jest.fn(),
            write: jest.fn(),
            end: jest.fn(),
          },
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
