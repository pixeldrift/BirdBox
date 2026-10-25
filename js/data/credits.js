// Sources, artists and partners credited on Account -> About. Add an entry here and it appears
// on that screen — nothing else to change.
//
// relationship: 'courtesy' (we simply recommend them — the default), 'partner' (a cross-promotion
// agreement) or 'affiliate' (a paid/affiliate link). Anything other than 'courtesy' is labelled
// on screen so readers can tell, and affiliate links are marked rel="sponsored". `disclosure` is
// optional extra text shown with a partner or affiliate entry.
// Only list addresses that have been checked.
// (Fonts and other technical credits are deliberately left out of the app.)
const CREDITS = [
  {
    title: 'Illustrations & artwork',
    blurb: 'The artists behind BirdBox’s icon styles. Choose a style in Account → Settings.',
    items: [
      {
        name: 'Birdorable',
        by: 'Birdorable.com',
        url: 'https://www.birdorable.com',
        description: 'Cute, round cartoon birds, with hundreds of species to browse. Their shop carries gifts and merchandise featuring your favorite birds.',
        used: 'The Birdorable icon style — one illustration per species.',
        relationship: 'courtesy',
      },
      {
        name: 'TeraTigerStudio',
        by: 'TeraTigerStudio',
        url: 'https://www.etsy.com/shop/TeraTigerStudio',
        description: 'Warm, hand-drawn parrots and other birds, sold as stickers and merchandise in their Etsy shop.',
        used: 'The Hand-Drawn icon style.',
        relationship: 'courtesy',
      },
    ],
  },
  {
    title: 'Species names & taxonomy',
    blurb: 'How BirdBox names and identifies every species.',
    items: [
      {
        name: 'Birds of the World',
        by: 'Cornell Lab of Ornithology',
        url: 'https://birdsoftheworld.org',
        description: 'The most complete reference on the world’s birds — detailed accounts for more than 11,000 species with illustrations, range maps and recordings. It’s a subscription service, so some content sits behind a login.',
        used: 'Every species in BirdBox links to its Birds of the World page.',
        relationship: 'courtesy',
      },
      {
        name: 'eBird & the Clements Checklist',
        by: 'Cornell Lab of Ornithology',
        url: 'https://ebird.org',
        description: 'The Cornell Lab’s worldwide bird-sighting database. Its taxonomy, the Clements Checklist, is the standard list of species, scientific names and species codes that Birds of the World uses too.',
        used: 'Supplies BirdBox’s species list, scientific names and species codes.',
        relationship: 'courtesy',
      },
      {
        name: 'Avibase',
        by: 'Bird Studies Canada',
        url: 'https://avibase.bsc-eoc.org',
        description: 'A database of bird names in many languages, with synonyms and comparisons between checklists. Handy when two sources call the same bird by different names.',
        used: 'Recommended reading — not used inside BirdBox yet.',
        relationship: 'courtesy',
      },
      {
        name: 'IOC World Bird List',
        by: 'International Ornithological Congress',
        url: 'https://www.worldbirdnames.org',
        description: 'A widely used alternative checklist. Useful for seeing how another authority names or splits a species when the Clements Checklist and your own records disagree.',
        used: 'Recommended reading — not used inside BirdBox yet.',
        relationship: 'courtesy',
      },
    ],
  },
];
