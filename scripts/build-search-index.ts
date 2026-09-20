import { writeSearchIndex } from "../lib/content";

function main() {
  console.log("Generating search index...");
  writeSearchIndex();
  console.log("Search index successfully written to public/search-index.json");
}

main();
