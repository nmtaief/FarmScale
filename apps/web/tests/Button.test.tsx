import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/Button";

describe("Button component", () => {
  it("renders with primary variant and accessible touch target", () => {
    render(<Button variant="primary">Explore Field</Button>);
    const button = screen.getByRole("button", { name: "Explore Field" });
    expect(button).toBeDefined();
    expect(button.className).toContain("touch-target");
    expect(button.className).toContain("bg-gold");
    expect(button.className).toContain("text-forest");
  });

  it("handles disabled state with disabledReason tooltip title", () => {
    render(
      <Button
        variant="primary"
        disabled
        disabledReason="AI assistant is coming soon"
      >
        Ask Assistant
      </Button>
    );
    const button = screen.getByRole("button", { name: "Ask Assistant" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button.getAttribute("title")).toBe("AI assistant is coming soon");
  });
});
