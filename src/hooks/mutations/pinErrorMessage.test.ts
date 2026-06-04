import { describe, it, expect, afterEach, vi } from "vitest";
import axios from "axios";
import { getPinErrorMessage } from "./pinErrorMessage";

describe("getPinErrorMessage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers the server's response message", () => {
    const error = {
      isAxiosError: true,
      response: { status: 403, data: { message: "Đã đạt giới hạn ghim" } },
    } as unknown;
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    expect(getPinErrorMessage(error, "fallback")).toBe("Đã đạt giới hạn ghim");
  });

  it("falls back to detail / title when message is absent", () => {
    const error = {
      isAxiosError: true,
      response: { status: 400, data: { title: "Bad Request" } },
    } as unknown;
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    expect(getPinErrorMessage(error, "fallback")).toBe("Bad Request");
  });

  it("uses the fallback for an axios error without a server message", () => {
    const error = {
      isAxiosError: true,
      message: "Request failed with status code 400",
      response: { status: 400, data: {} },
    } as unknown;
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    expect(getPinErrorMessage(error, "Không thể ghim")).toBe("Không thể ghim");
  });

  it("uses a plain Error's message", () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false);

    expect(getPinErrorMessage(new Error("Boom"), "fallback")).toBe("Boom");
  });

  it("uses the fallback for unknown error shapes", () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValue(false);

    expect(getPinErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});
