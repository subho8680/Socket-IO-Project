import test from "node:test";
import assert from "node:assert/strict";
import { buildSubmissionPayload, mapCodeboxStatus } from "../Services/CodeboxRunner.js";

test("maps Codebox TLE status to tle", () => {
  const result = mapCodeboxStatus(5);
  assert.deepEqual(result, {
    status: "tle",
    label: "Time Limit Exceeded",
    description: "Time Limit Exceeded",
  });
});

test("omits expected output when not provided", () => {
  const payload = buildSubmissionPayload({
    code: "#include <iostream>\nint main(){return 0;}",
    languageId: 54,
    input: "",
    expectedOutput: null,
  });

  assert.equal(payload.source_code.length > 0, true);
  assert.equal(payload.stdin, "");
  assert.equal("expected_output" in payload, false);
});
