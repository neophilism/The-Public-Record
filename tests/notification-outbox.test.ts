import {describe,it,expect,vi} from "vitest";
import {enqueueCaseUpdate,nextNotificationRetry} from "./notification-outbox";

describe("consented case notification enqueue",()=>{
  it("uses a conditional, duplicate-safe insert without case content",async()=>{
    const query=vi.fn().mockResolvedValueOnce({rows:[{id:1}]}).mockResolvedValue({rows:[]});
    const intent={ownerSubject:"subject-A",idempotencyKey:"abcdefgh12345678",linkPath:"/public-record/cases/a1"};
    expect(await enqueueCaseUpdate({query},intent)).toBe(true);
    expect(await enqueueCaseUpdate({query},intent)).toBe(false);
    expect(query.mock.calls[0][0]).toContain("ON CONFLICT (owner_subject,idempotency_key) DO NOTHING");
    expect(query.mock.calls[0][1]).toEqual(["subject-A","abcdefgh12345678","/public-record/cases/a1"]);
  });
  it("rejects external links and malformed intents before storage",async()=>{
    const query=vi.fn();
    await expect(enqueueCaseUpdate({query},{ownerSubject:"a",idempotencyKey:"abcdefgh12345678",linkPath:"//attacker.example"})).rejects.toThrow();
    await expect(enqueueCaseUpdate({query},{ownerSubject:"a",idempotencyKey:"short",linkPath:"/public-record/a"})).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  });
  it("bounds retries and sends a fifth failure to dead letter",()=>{
    expect(nextNotificationRetry(1,100)).toBe(130);
    expect(nextNotificationRetry(4,100)).toBe(340);
    expect(nextNotificationRetry(5,100)).toBeNull();
  });
});
