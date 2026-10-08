const tools = [
  {
    name: "get_case_summary",
    description:
      "Retrieves the basic case summary and velocity/device signals for a fraud case, given a case ID. Always call this first for any case investigation.",
    input_schema: {
      type: "object",
      properties: { case_id: { type: "string" } },
      required: ["case_id"],
    },
  },
  {
    name: "get_identity_verification",
    description:
      "Retrieves deeper identity verification details (SSN issuance history, employer verification, address history) for a case. Only useful when the case summary suggests a possible identity inconsistency rather than a velocity/device pattern.",
    input_schema: {
      type: "object",
      properties: { case_id: { type: "string" } },
      required: ["case_id"],
    },
  },
];

module.exports = { tools };
