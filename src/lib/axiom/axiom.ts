import { Axiom } from "@axiomhq/js";

if (!process.env.AXIOM_TOKEN) {
  throw new Error("AXIOM_TOKEN environment variable is not set");
}

const axiomClient = new Axiom({
  token: process.env.AXIOM_TOKEN,
});

export default axiomClient;
