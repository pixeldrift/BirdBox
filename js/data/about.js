// Copy for Account -> About. Plain-language and friendly; no technical detail. Keep the roadmap in
// step with docs/roadmap.md when plans change (this is the simplified, public-facing version).
const ABOUT = {
  tagline: 'A cozy home for your birds’ records.',
  intro: 'BirdBox helps bird breeders keep track of their flock — who’s who, who’s related, how everyone’s doing, and the business side too — all in one friendly place.',
  creator: 'Nathan D. B. Pizar',
  contactEmail: 'nathan@pizar.net',
  copyrightStartYear: 2026,
  audience: 'Made for bird breeders — hobbyists and small aviaries who want their records tidy, in one place, and easy to find when they need them.',

  features: [
    { title: 'Your flock', text: 'One record for every bird: band number, species, mutation, hatch date, where it lives, notes, and family links to parents, mates and offspring. Add birds one at a time, or import a whole spreadsheet.' },
    { title: 'Species made simple', text: 'Search by any name you know — Sun Conure, Goffin’s, African Grey — and BirdBox finds the right species, with a link to learn more about it.' },
    { title: 'Health records', text: 'Vet visits, DNA certificates, immunizations and surgical sexing reports, each linked to the bird it belongs to.' },
    { title: 'Registry', text: 'A public band-number lookup, for finding a bird’s pedigree or reuniting a lost one. Your birds stay out of it unless you choose to include them.' },
    { title: 'Cages', text: 'See which birds live where.' },
    { title: 'The business side', text: 'Contacts, income and expenses, shipments with costs and waybills, and simple charts that show how the year is going.' },
    { title: 'Your look', text: 'Pick an icon style — line art, hand-drawn, or cartoon — for birds that don’t have a photo yet.' },
  ],

  // Wishes, not promises — the closing note says so.
  roadmap: [
    {
      title: 'Coming soon',
      items: [
        'Photos and documents saved safely, with accounts so your records follow you across devices',
        'Editing birds, and adding contacts, sales and shipments right in the app',
      ],
    },
    {
      title: 'On the horizon',
      items: [
        'Family trees, inbreeding checks and a pairing planner',
        'Breeding season tracking: clutches, eggs and hatching, with reports',
        'Lost & Found alerts and a classifieds board',
        'Printable labels, cage cards with QR codes, and shipping labels',
        'Finer control over exactly which details of a bird are public',
      ],
    },
    {
      title: 'Someday',
      items: [
        'A color-mutation guide to go with every species',
        'Feed, supplies and chores for larger aviaries',
        'More icon styles',
      ],
    },
  ],
  roadmapNote: 'Plans change — think of this as a wish list, not a promise.',
};
