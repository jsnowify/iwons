// Shared, deliberately small lists. Keep all reserved/profane username and
// common-password policy here so client hints and server validation agree.
export const RESERVED_USERNAMES = Object.freeze([
  "admin", "root", "support", "api", "system", "null", "undefined", "me",
  "auth", "login", "signup", "settings",
]);
export const PROFANE_USERNAME_PARTS = Object.freeze(["fuck", "shit", "asshole", "bitch"]);
export const COMMON_PASSWORDS = Object.freeze([
  "password", "password1", "password123", "12345678", "123456789", "1234567890",
  "qwerty123", "qwertyuiop", "abc12345", "iloveyou", "letmein", "letmein123",
  "welcome", "welcome1", "admin123", "00000000", "11111111",
  "12345678910", "1q2w3e4r5t", "1qaz2wsx", "123123123", "123456789a", "987654321", "123qweasd",
  "qwerty12345", "qwerty1234", "qwertyui", "asdfghjkl", "asdfgh123", "zxcvbnm123", "zaq12wsx",
  "football1", "baseball1", "basketball", "superman1", "sunshine1", "princess1", "dragon123",
  "monkey123", "master123", "shadow123", "michael1", "jennifer1", "trustno1", "passw0rd",
  "p@ssw0rd", "p@ssword", "password!", "password12", "password1234", "password12345",
  "changeme", "changeme123", "administrator", "iloveyou1", "iloveyou123", "welcome123",
  "letmein1", "login1234", "internet1", "computer1", "whatever1", "starwars1", "pokemon123",
  "abcd1234", "abcdefg123", "aaaaaaaa", "99999999", "88888888", "12341234", "11223344", "iwons123",
]);
