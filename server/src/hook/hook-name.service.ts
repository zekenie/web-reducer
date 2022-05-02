import { difference, sample } from "lodash";
import { nanoid } from "nanoid";
import { getHookNameCollisions } from "./hook.db";
import { NameCollisionError } from "./hook.errors";

export function generateHookName() {
  return `${sample(adjectives)}-${sample(nouns)}-${nanoid(4)}`;
}

export async function generateUnusedHookName(attempts = 0): Promise<string> {
  if (attempts > 4) {
    throw new NameCollisionError();
  }
  const names = [
    generateHookName(),
    generateHookName(),
    generateHookName(),
    generateHookName(),
  ];
  const collisions = await getHookNameCollisions({ names });
  const [nameWithoutCollision] = difference(names, collisions);

  if (!nameWithoutCollision) {
    return generateUnusedHookName(attempts + 1);
  }

  return nameWithoutCollision;
}

const adjectives = [
  "autumn",
  "hidden",
  "bitter",
  "misty",
  "silent",
  "empty",
  "dry",
  "dark",
  "summer",
  "icy",
  "delicate",
  "quiet",
  "white",
  "cool",
  "spring",
  "winter",
  "patient",
  "crimson",
  "wispy",
  "weathered",
  "blue",
  "billowing",
  "broken",
  "cold",
  "damp",
  "falling",
  "frosty",
  "green",
  "long",
  "late",
  "bold",
  "little",
  "morning",
  "muddy",
  "red",
  "rough",
  "still",
  "small",
  "sparkling",
  "shy",
  "wandering",
  "withered",
  "wild",
  "black",
  "young",
  "holy",
  "solitary",
  "fragrant",
  "aged",
  "snowy",
  "proud",
  "floral",
  "restless",
  "polished",
  "purple",
  "lively",
  "nameless",
  "scarlet",
  "gloomy",
  "lucid",
  "snarling",
  "lurking",
  "fierce",
  "furious",
  "lonely",
  "gnawing",
  "burning",
  "keen",
  "boggy",
  "swampy",
  "torrid",
  "glowing",
  "arid",
  "droughty",
  "skinny",
  "meager",
  "stout",
  "sturdy",
  "crispy",
  "blooming",
  "stormy",
  "rousing",
  "flowing",
  "old",
  "glistening",
  "clear",
  "winding",
  "meandering",
  "mild",
  "hot",
  "frozen",
  "frightening",
  "lucky",
  "profound",
  "aqueous",
  "arcane",
  "cryptic",
  "fast",
  "gentle",
  "immense",
  "limitless",
  "lit",
  "murmuring",
  "protected",
  "pure",
  "rocky",
  "polite",
  "cautious",
  "perky",
  "naughty",
  "upright",
  "straight",
];

const nouns = [
  "waterfall",
  "river",
  "breeze",
  "moon",
  "rain",
  "wind",
  "sea",
  "morning",
  "snow",
  "lake",
  "sunset",
  "pine",
  "shadow",
  "leaf",
  "dawn",
  "glitter",
  "forest",
  "hill",
  "cloud",
  "meadow",
  "sun",
  "glade",
  "bird",
  "brook",
  "butterfly",
  "bush",
  "dew",
  "dust",
  "field",
  "fire",
  "flower",
  "firefly",
  "feather",
  "grass",
  "haze",
  "mountain",
  "night",
  "pond",
  "darkness",
  "snowflake",
  "silence",
  "sound",
  "sky",
  "shape",
  "surf",
  "thunder",
  "violet",
  "water",
  "wildflower",
  "wave",
  "water",
  "resonance",
  "sun",
  "wood",
  "dream",
  "cherry",
  "tree",
  "fog",
  "frost",
  "voice",
  "frog",
  "smoke",
  "star",
  "ibex",
  "roe",
  "deer",
  "cave",
  "stream",
  "creek",
  "ditch",
  "puddle",
  "oak",
  "fox",
  "wolf",
  "owl",
  "eagle",
  "hawk",
  "badger",
  "nightingale",
  "ocean",
  "island",
  "marsh",
  "swamp",
  "blaze",
  "glow",
  "hail",
  "echo",
  "flame",
  "twilight",
  "whale",
  "raven",
  "blossom",
  "mist",
  "ray",
  "beam",
  "stone",
  "rock",
  "cliff",
  "reef",
  "crag",
  "peak",
  "summit",
  "wetland",
  "glacier",
  "thunderstorm",
  "ice",
  "firn",
  "spark",
  "boulder",
  "rabbit",
  "abyss",
  "avalanche",
  "moor",
  "reed",
  "harbor",
  "chamber",
  "savannah",
  "garden",
  "brook",
  "earth",
  "oasis",
  "bastion",
  "ridge",
  "bayou",
  "citadel",
  "shore",
  "cavern",
  "gorge",
  "spring",
  "arrow",
  "heap",
];
