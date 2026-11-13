import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore, DEFAULT_LOCATION } from "@/lib/store/useAppStore";

describe("useAppStore client store", () => {
  beforeEach(() => {
    useAppStore.setState({
      location: DEFAULT_LOCATION,
      priorities: { water: 8, income: 3, soil: 4 },
      viewMode: "simple",
      theme: "light",
      isOffline: false,
    });
  });

  it("initializes with Rajshahi Barind Tract pilot location", () => {
    const state = useAppStore.getState();
    expect(state.location.district).toBe("Rajshahi");
    expect(state.location.isPilot).toBe(true);
    expect(state.location.lat).toBe(24.3745);
    expect(state.location.lon).toBe(88.6042);
  });

  it("toggles between simple and expert view modes", () => {
    expect(useAppStore.getState().viewMode).toBe("simple");
    useAppStore.getState().toggleViewMode();
    expect(useAppStore.getState().viewMode).toBe("expert");
    useAppStore.getState().toggleViewMode();
    expect(useAppStore.getState().viewMode).toBe("simple");
  });

  it("clamps priority values between 0 and 10", () => {
    useAppStore.getState().setPriority("water", 15);
    expect(useAppStore.getState().priorities.water).toBe(10);

    useAppStore.getState().setPriority("water", -5);
    expect(useAppStore.getState().priorities.water).toBe(0);
  });
});
