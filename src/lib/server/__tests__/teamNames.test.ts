import { describe, it, expect } from "vitest";
import { toCanonicalTeamName } from "../teamNames";

describe("toCanonicalTeamName", () => {
  it("translates the upstream English names that bit us live", () => {
    expect(toCanonicalTeamName("United States")).toBe("Estados Unidos");
    expect(toCanonicalTeamName("Paraguay")).toBe("Paraguai");
    expect(toCanonicalTeamName("Brazil")).toBe("Brasil");
    expect(toCanonicalTeamName("Morocco")).toBe("Marrocos");
    expect(toCanonicalTeamName("Switzerland")).toBe("Suíça");
    expect(toCanonicalTeamName("Qatar")).toBe("Catar");
  });

  it("returns the input unchanged when no mapping is known", () => {
    expect(toCanonicalTeamName("Brasil")).toBe("Brasil");
    expect(toCanonicalTeamName("")).toBe("");
    expect(toCanonicalTeamName("Atlantis")).toBe("Atlantis");
  });

  it("handles upstream alias drift (Czechia, Türkiye, Côte d'Ivoire)", () => {
    expect(toCanonicalTeamName("Czechia")).toBe("República Tcheca");
    expect(toCanonicalTeamName("Türkiye")).toBe("Turquia");
    expect(toCanonicalTeamName("Côte d'Ivoire")).toBe("Costa do Marfim");
  });
});
