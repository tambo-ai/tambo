export async function getAIResponse(prompt) {
  // simple simulation of AI choosing component
  const p = prompt.toLowerCase();
  if (p.includes("form")) return "UserForm";
  if (p.includes("table") || p.includes("analytics")) return "DataTable";
  return "InfoCard";
}
