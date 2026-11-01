import { mergeMessages } from "../mergeMessages";
import englishUsers from "@/messages/en/admin/users.json";
import amharicUsers from "@/messages/am/admin/users.json";

it("uses translated values and fills missing keys from English", () => {
  const messages = mergeMessages(englishUsers, amharicUsers);
  expect(messages.adminusers.firstname).toBe(amharicUsers.adminusers.firstname);
  expect(messages.adminusers.sendemail).toBe(englishUsers.adminusers.sendemail);
  expect(messages.adminusers.passwordcopyfailed).toBe(
    amharicUsers.adminusers.passwordcopyfailed
  );
});

it("does not discard namespaces that have no translation file", () => {
  expect(mergeMessages({ login: { submit: "Log in" } }, {})).toEqual({
    login: { submit: "Log in" },
  });
});
