import { describe, expect, it } from "vitest";
import { normalizeClientAddress } from "@/lib/client-address";

describe("client address used for rate limiting", () => {
  it("keeps IPv4 addresses and takes the first of a forwarded list", () => {
    expect(normalizeClientAddress("203.0.113.7")).toBe("203.0.113.7");
    expect(normalizeClientAddress(" 203.0.113.7 , 10.0.0.1")).toBe("203.0.113.7");
  });
  it("reduces IPv6 to its /64 so one machine cannot rotate through billions of addresses", () => {
    const a = normalizeClientAddress("2001:db8:abcd:12:aaaa:bbbb:cccc:dddd"), b = normalizeClientAddress("2001:0db8:abcd:0012::1");
    expect(a).toBe("2001:db8:abcd:12::/64");
    expect(b).toBe(a);
    expect(normalizeClientAddress("2001:db8:abcd:13::1")).not.toBe(a);
    expect(normalizeClientAddress("2001:DB8:ABCD:12::ffff%eth0")).toBe(a);
    expect(normalizeClientAddress("::1")).toBe("0:0:0:0::/64");
    expect(normalizeClientAddress("fe80::1")).toBe("fe80:0:0:0::/64");
  });
  it("treats IPv4-mapped IPv6 as the IPv4 address", () => {
    expect(normalizeClientAddress("::ffff:203.0.113.7")).toBe("203.0.113.7");
    expect(normalizeClientAddress("::ffff:cb00:7107")).toBe("203.0.113.7");
  });
  it("rejects anything that is not an address", () => {
    for (const value of [undefined, null, "", "  ", "not-an-ip", "999.1.1.1", "1.2.3", "2001:db8::zz", "2001:db8:::1", "1:2:3:4:5:6:7:8:9", "example.com", "203.0.113.7:8080"])
      expect(normalizeClientAddress(value as string | null | undefined), String(value)).toBeNull();
  });
});
