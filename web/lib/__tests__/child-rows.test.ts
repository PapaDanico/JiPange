import { describe, it, expect } from "vitest";
import { nextChildId } from "../../components/tools/SchoolFeesLifetimeCalculator";

/**
 * Row ids must be unique for the life of the form, not merely for its length.
 *
 * The first version numbered a new row by the row COUNT, which collides the
 * moment anything is removed. Two rows then share a React key and a DOM id:
 * edits land on the wrong child, and `<label for>` resolves to whichever
 * input the browser reaches first. Found by driving add → remove first → add,
 * which is simply what a parent does after mistyping a grade.
 */
describe("child row ids", () => {
  it("numbers the first row from one", () => {
    expect(nextChildId([])).toBe("c1");
  });

  it("survives the add / remove-first / add sequence that collided", () => {
    const rows = (...ids: string[]) => ids.map((id) => ({ id, name: "", gradeValue: "", annualFee: "" }));
    // Add a second child.
    expect(nextChildId(rows("c1"))).toBe("c2");
    // Remove the first, leaving one row whose id is already c2.
    // Counting rows would return "c2" again; this must not.
    expect(nextChildId(rows("c2"))).toBe("c3");
  });

  it("goes past the highest id in use, not the next gap", () => {
    // Reusing a freed id is also wrong: React would match the new row against
    // the removed one's unmounted state.
    const rows = (...ids: string[]) => ids.map((id) => ({ id, name: "", gradeValue: "", annualFee: "" }));
    expect(nextChildId(rows("c1", "c4"))).toBe("c5");
    expect(nextChildId(rows("c3", "c1", "c2"))).toBe("c4");
  });

  it("never returns an id already present, over a long add/remove walk", () => {
    // The property the two cases above are examples of.
    let rows = [{ id: "c1", name: "", gradeValue: "", annualFee: "" }];
    for (let step = 0; step < 50; step++) {
      const id = nextChildId(rows);
      expect(rows.map((r) => r.id), `${id} was already in use`).not.toContain(id);
      rows = [...rows, { id, name: "", gradeValue: "", annualFee: "" }];
      if (step % 2 === 0) rows = rows.slice(1); // drop the oldest, as Remove does
    }
  });

  it("tolerates an id that is not in the cN shape rather than producing NaN", () => {
    // Rows come back from localStorage, which anyone can edit.
    const rows = [{ id: "junk", name: "", gradeValue: "", annualFee: "" }];
    expect(nextChildId(rows)).toBe("c1");
  });
});
