import * as assert from "assert";
import { describe, it } from "mocha";
import * as Client from "ucanto/src/client.js";
import * as Transport from "ucanto/src/transport.js";
import * as Issuer from "./actor/issuer.js";
import * as Server from "ucanto/src/server.js";
import { service } from "./service.js";
import { CID } from "multiformats";
describe("server", () => {
  it("can be invoked via no transport", async () => {
    const alice = await Issuer.generate();
    const server = Server.create({
      service,
      decoder: Transport.CAR,
      encoder: Transport.CBOR,
    });
    const connection = Client.connect({
      encoder: Transport.CAR,
      decoder: Transport.CBOR,
      channel: server,
    });
    const publish = Client.invoke({
      issuer: alice,
      audience: service,
      capability: {
        can: "name/publish",
        with: alice.did(),
        content: CID.parse(
          "bafybeidaaryc6aga3zjpujfbh4zabwzogd22y4njzrqzc4yv6nvyfm3tee"
        ),
      },
    });
    const publishResponse = await publish.execute(connection);
    assert.ok(publishResponse.ok);
  });
});
