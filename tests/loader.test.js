/**
 * author: es6a2 group
 */
const assert = require("assert");
const Loader = require("../src/lib/Repositories/SolidLoaderRepository");
const auth = require("solid-auth-client");

describe("Loader", function() {
  it("Loading chat and interlocutor", async function() {
    const loader = new Loader(auth.fetch);
    const chat = await loader.loadChatFromUrl("https://morningstar.solid.community/public/dechat_201903160752.ttl#jtbuliv7", "https://morningstar.solid.community/profile/card#me", "https://morningstar.solid.community/public/dechat_201903160752.ttl");
    assert.equal(chat.getUrl(), "https://morningstar.solid.community/public/dechat_201903160752.ttl#jtbuliv7", "The url of the chat is not correct." + chat.url);
    assert.equal(chat.userWebId, "https://morningstar.solid.community/profile/card#me", "The WebId of the user is not correct : " + chat.userWebId);
  });
});
