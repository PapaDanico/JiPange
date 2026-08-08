import { describe, expect, it } from "vitest";
import { REPORT_TO, reportBody, reportMailto, reportSubject } from "../report-error";
import { CONTROLLER } from "../privacy-facts";

const CONTEXT = { title: "PAYE & Net Salary", path: "/tools/salary" };

describe("reportSubject", () => {
  it("names the calculator, so a report is triageable from the inbox list", () => {
    expect(reportSubject(CONTEXT)).toBe("Possible error: PAYE & Net Salary");
  });
});

describe("reportBody", () => {
  it("asks for the three things that make a report actionable", () => {
    const body = reportBody(CONTEXT);
    expect(body).toContain("What the calculator showed:");
    expect(body).toContain("What I think it should be:");
    // The one that turns a complaint into a fix.
    expect(body).toContain("Where I'm getting that from");
  });

  it("identifies the page, so the reader does not have to paste a URL", () => {
    expect(reportBody(CONTEXT)).toContain("https://jipangefinance.org/tools/salary");
  });

  /* THE POINT OF THE WHOLE MODULE. A calculator's fields hold a salary, a
   * debt, a school fee. Putting those into an outgoing mail body because
   * somebody clicked a link is exfiltration with extra steps, however visible
   * the draft is. If a future change starts prefilling inputs "to help", this
   * test is the thing that should stop it. */
  it("prefills nothing the reader typed into the calculator", () => {
    const body = reportBody(CONTEXT);
    // Strip the two things the body is allowed to carry — the title and the
    // route — and no digit may remain. A figure cannot reach the draft without
    // showing up here, whatever it is denominated in.
    const remainder = body.split(CONTEXT.title).join("").split(CONTEXT.path).join("");
    expect(remainder).not.toMatch(/\d/);
  });
});

describe("reportMailto", () => {
  it("goes to the same address the privacy notice names", () => {
    expect(REPORT_TO).toBe(CONTROLLER.contact);
    expect(reportMailto(CONTEXT).startsWith(`mailto:${CONTROLLER.contact}?`)).toBe(true);
  });

  /* Titles are free text set at each of 27 call sites, not a set this module
   * controls. A raw "&" would end the subject early and silently truncate it —
   * the reader would send a subject line missing half its words and never know. */
  it("encodes a title that would otherwise break the query string", () => {
    const url = reportMailto(CONTEXT);
    const query = url.slice(url.indexOf("?") + 1);
    const params = new URLSearchParams(query);
    expect(params.get("subject")).toBe("Possible error: PAYE & Net Salary");
    // And the ampersand did not survive raw, which is what would have split it.
    expect(query).not.toContain("Net Salary");
    expect(query).toContain("%26");
  });

  it("keeps the body intact through encoding, newlines and all", () => {
    const url = reportMailto(CONTEXT);
    const params = new URLSearchParams(url.slice(url.indexOf("?") + 1));
    expect(params.get("body")).toBe(reportBody(CONTEXT));
  });
});
