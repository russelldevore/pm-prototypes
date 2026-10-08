const caseData = require("./case-data.json");

// These stand in for real system calls (rules engine, identity vendor API).
// Swap the body of each function later without touching the agent loop or tool schema.
function get_case_summary({ case_id }) {
  const record = caseData[case_id];
  if (!record) return { error: `No case found for ${case_id}` };
  return {
    case_id,
    summary: record.summary,
    velocity_flag: record.velocity_flag,
    device_reuse_count: record.device_reuse_count,
  };
}

function get_identity_verification({ case_id }) {
  const record = caseData.IDENTITY_DETAILS && caseData.IDENTITY_DETAILS[case_id];
  if (!record) return { error: `No identity verification record found for ${case_id}` };
  return { case_id, ...record };
}

const toolFunctions = { get_case_summary, get_identity_verification };

module.exports = { toolFunctions };
