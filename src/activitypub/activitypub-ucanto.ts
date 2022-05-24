import {
  InboxGetRequest,
  InboxGetResponse,
  InboxPostableActivity,
  InboxPostResponse,
} from "./inbox.js";
import type { DID } from "@ipld/dag-ucan/src/ucan";
import type { Result } from "ucanto/src/client";
import type { Invocation, Link, UCAN } from "ucanto/src/client";
import { AnnounceActivityPubCom } from "./announcement.js";
import { ArrayRepository } from "./repository-array.js";

export type KnownActivitypubActivity = AnnounceActivityPubCom;

export type { DID } from "@ipld/dag-ucan/src/ucan";
export type { Result } from "ucanto/src/client";
export { Invocation, Capability } from "ucanto/src/client";

/**
 * ActivityPub service powered by ucanto.
 * It exposes an interface of methods which handle ucanto Invocations
 * @category activitypub-ucanto
 */
export function ActivityPubUcanto(): ActivityPubUcantoAbstraction {
  const inboxRepository = new ArrayRepository<KnownActivitypubActivity>();
  const outboxRepository = new ArrayRepository<KnownActivitypubActivity>();
  return new _ActivityPubUcanto(
    () => inboxRepository,
    () => outboxRepository
  );
}

export type {
  InboxPostableActivity,
  InboxGetRequest,
  InboxGetResponse,
  InboxPostRequest,
  InboxPostResponse,
} from "./inbox.js";
export type { OutboxGet, OutboxPost } from "../activitypub-outbox/outbox.js";
import {
  OutboxGet,
  OutboxGetHandler,
  OutboxPost,
  OutboxPostableActivity,
  OutboxPostHandler,
} from "../activitypub-outbox/outbox.js";

export type Ability = UCAN.Ability;
export type Resource = UCAN.Resource;

// inbox
export type InboxGetUcanto = InboxGetRequest & {
  with: DID;
  can: "activitypub/inbox/get";
};
export type InboxPostUcanto = {
  can: "activitypub/inbox/post";
  with: DID;
  activity: InboxPostableActivity;
};
export type InboxPostUcantoHandler = (
  invocation: Invocation<InboxPostUcanto>
) => Promise<Result<InboxPostResponse, Error>>;
export type InboxGetUcantoHandler = (
  invocation: Invocation<InboxGetUcanto>
) => Promise<Result<InboxGetResponse, Error>>;

export interface InboxUcanto {
  get: InboxGetUcantoHandler;
  post: InboxPostUcantoHandler;
}

// bind outbox<->ucanto

export type OutboxPostUcantoHandler = (
  invocation: Invocation<OutboxPostUcanto>
) => Promise<Result<OutboxPost["Response"], Error>>;
export type OutboxGetUcantoHandler = (
  invocation: Invocation<OutboxGetUcanto>
) => Promise<Result<OutboxGet["Response"], Error>>;
export type OutboxGetUcanto = {
  with: DID;
  can: "activitypub/outbox/get";
};
export type OutboxPostUcanto = {
  can: "activitypub/outbox/post";
  with: DID;
  activity: OutboxPostableActivity;
};

export interface OutboxUcanto {
  get: OutboxGetUcantoHandler;
  post: OutboxPostUcantoHandler;
}

/**
 * Implements ActivityPub Server as ucanto Invocations
 */
class _ActivityPubUcanto {
  // public inbox: InboxUcanto;
  constructor(
    private getInboxRepository: () => ArrayRepository<AnnounceActivityPubCom>,
    private getOutboxRepository: () => ArrayRepository<AnnounceActivityPubCom>
  ) {}
  public did(): DID {
    return "did:web:activitypub.com";
  }
  public get outbox(): OutboxUcanto {
    // get outbox
    const get: OutboxGetUcantoHandler = async (_invocation) => {
      const value: OutboxGet["Response"] = await new OutboxGetHandler(
        this.getOutboxRepository()
      ).handle({});
      return { ok: true, value };
    };
    // post to outbox
    const post: OutboxPostUcantoHandler = async (_invocation) => {
      const { activity } = _invocation.capability;
      const value: OutboxPost["Response"] = await new OutboxPostHandler(
        this.getOutboxRepository()
      ).handle(activity);
      return { ok: true, value };
    };
    return { get, post };
  }
  public get inbox(): InboxUcanto {
    // get inbox
    const get: InboxGetUcantoHandler = async (_invocation) => {
      const value: InboxGetResponse = {
        totalItems: await this.getInboxRepository().count(),
      };
      return { ok: true, value };
    };
    // post to inbox
    const post: InboxPostUcantoHandler = async (_invocation) => {
      const { activity } = _invocation.capability;
      await this.getInboxRepository().push(activity);
      const value: InboxPostResponse = {
        posted: true,
      };
      return { ok: true, value };
    };
    return { get, post };
  }
}

/**
 * Abstract class for ActivityPub over ucanto
 */
export interface ActivityPubUcantoAbstraction {
  did(): DID;
  inbox: InboxUcanto;
  outbox: OutboxUcanto;
}
