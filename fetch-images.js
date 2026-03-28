// Build script: Fetches boxer images from Wikipedia API
// Generates public/data/fighters.json with all fight data + image URLs

const { FIGHTERS, FIGHTS, NICKNAMES } = require("./fights.js");
const fs = require("fs");
const path = require("path");

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const IMAGE_WIDTH = 400;

async function fetchFighterImage(wikiTitle) {
  const params = new URLSearchParams({
    action: "query",
    titles: wikiTitle,
    prop: "pageimages",
    pithumbsize: IMAGE_WIDTH,
    format: "json",
    formatversion: "2",
  });

  const url = `${WIKI_API}?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Wikipedia API error for ${wikiTitle}: ${res.status}`);
    return null;
  }

  const data = await res.json();
  const page = data.query?.pages?.[0];
  if (!page || page.missing) {
    console.warn(`  Page not found: ${wikiTitle}`);
    return null;
  }

  return page.thumbnail?.source || null;
}

async function main() {
  console.log("Boxing Quiz — Fetching fighter images from Wikipedia...\n");

  const fighterData = {};
  const ids = Object.keys(FIGHTERS);

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const fighter = FIGHTERS[id];
    process.stdout.write(`[${i + 1}/${ids.length}] ${fighter.name}...`);

    const image = await fetchFighterImage(fighter.wiki);
    fighterData[id] = {
      name: fighter.name,
      image: image,
    };

    if (image) {
      console.log(" OK");
    } else {
      console.log(" (no image)");
    }

    // Small delay to be respectful to Wikipedia API
    if (i < ids.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Count stats
  const withImage = Object.values(fighterData).filter((f) => f.image).length;
  const totalFighters = ids.length;

  const output = {
    version: 1,
    generated: new Date().toISOString(),
    stats: {
      fighters: totalFighters,
      fightersWithImage: withImage,
      fights: FIGHTS.length,
    },
    fighters: fighterData,
    fights: FIGHTS,
    nicknames: NICKNAMES,
  };

  // Ensure output directory exists
  const outDir = path.join(__dirname, "public", "data");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "fighters.json");
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  console.log(`\nDone! ${outFile}`);
  console.log(`  ${totalFighters} fighters (${withImage} with images)`);
  console.log(`  ${FIGHTS.length} title fights`);
  console.log(`  ${NICKNAMES.length} nicknames`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
