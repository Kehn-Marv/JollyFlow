import type { EventType, VendorCategory } from '../types/domain';

/** [title, why, category, days before event, vendor service key] */
type TaskDef = [string, string, string, number, string?];

export const TASK_LIBRARY: Record<string, TaskDef> = {
  budget: ['Agree the total budget and who’s contributing', 'Everything else is sized from this number.', 'Budget', 120],
  guestlist: ['Draft the guest list', 'Your headcount drives venue, food and seating.', 'Guests', 100],
  families: ['Agree the programme with both families', 'Covers the list, introductions and who leads each part.', 'Families', 100],
  venue: ['Shortlist and visit venues', 'Check capacity, parking, power backup and closing time.', 'Venue', 90, 'venue'],
  agenda: ['Agree the objective and agenda', 'Venue, AV and speakers all follow from it.', 'Programme', 80],
  talent: ['Confirm performers and their riders', 'Agree set times, fees and technical needs in writing.', 'Talent', 80, 'entertainment'],
  caterer: ['Shortlist caterers and book a tasting', 'Taste before paying a deposit; agree per-head pricing.', 'Catering', 75, 'catering'],
  asoebi: ['Choose aso-ebi and set a collection deadline', 'Gives guests time to buy fabric and sew.', 'Attire', 70],
  tickets: ['Set up ticket tiers and a sales cut-off', 'Price points decide your break-even.', 'Tickets', 65],
  decor: ['Agree the decor style and book a decorator', 'Share reference photos and the venue layout.', 'Decor', 60, 'decor'],
  photo: ['Book a photographer', 'Confirm coverage hours and delivery date in writing.', 'Photography', 60, 'photography'],
  sound: ['Book sound, lighting and stage', 'Get the equipment list with a technician on site.', 'Production', 60, 'audiovisual'],
  mc: ['Book an MC or Alaga', 'Keeps the programme on time and the room engaged.', 'Entertainment', 50, 'entertainment'],
  promo: ['Announce the event', 'Go early, then again two weeks out.', 'Promotion', 45],
  dj: ['Book a DJ or live band', 'Confirm who brings the sound equipment.', 'Entertainment', 45, 'entertainment'],
  invites: ['Send invitations and open RSVPs', 'Lets guests plan travel and outfits.', 'Guests', 42],
  deposits: ['Put a due date on every vendor deposit', 'So nothing lapses and you know what’s owed.', 'Budget', 40],
  cake: ['Order the cake', 'Size it to the confirmed headcount.', 'Catering', 25, 'cake'],
  makeup: ['Book makeup and hair with a trial', 'Check how many faces they can do in time.', 'Beauty', 30, 'beauty'],
  rentals: ['Book chairs, canopies and a generator', 'Count against headcount; confirm delivery times.', 'Logistics', 21, 'rentals'],
  security: ['Arrange security and gate staff', 'Plan entry, exits and crowd flow.', 'Security', 21],
  souvenirs: ['Order souvenirs', 'Headcount plus about 10% for extras.', 'Extras', 21],
  officiant: ['Confirm the officiant and order of naming', 'Agree names, prayers and timing with the family.', 'Programme', 14],
  transport: ['Plan transport for family and key guests', 'Share pickup times and drivers’ numbers.', 'Logistics', 14],
  headcount: ['Confirm final numbers with the caterer', 'Quantities should follow RSVPs, not invites.', 'Catering', 10],
  programme: ['Write the order of events', 'Share it with the MC and every vendor.', 'Programme', 10],
  seating: ['Plan seating, ushers and VIP tables', 'Avoids crowding at the entrance.', 'Logistics', 6],
  neighbours: ['Let neighbours or estate security know', 'Avoids noise complaints and gate delays.', 'Logistics', 5],
  confirm: ['Confirm setup times with every vendor', 'So vendors don’t all arrive at once.', 'Vendors', 3],
  rehearsal: ['Run a tech and programme rehearsal', 'Catches mic, slide and timing issues early.', 'Programme', 2],
  pointperson: ['Name a point person for the day', 'Someone other than the host fields vendor questions.', 'Logistics', 2]
};

/** Tasks still worth doing when the event is under two weeks away. */
export const ESSENTIAL = new Set(['budget', 'guestlist', 'families', 'venue', 'caterer', 'agenda', 'tickets', 'talent']);

/** [label, directory category or null, what to look for] */
export const VENDOR_LIBRARY: Record<string, [string, VendorCategory | null, string]> = {
  venue: ['Venue', 'venue', 'Capacity, parking, power backup'],
  catering: ['Caterer', 'catering', 'Tasting, per-head price, serving staff'],
  decor: ['Decorator', 'decor', 'Portfolio in similar venues, setup time'],
  photography: ['Photographer', 'photography', 'Coverage hours, delivery date'],
  entertainment: ['MC, DJ or band', 'entertainment', 'Past event clips, own equipment'],
  audiovisual: ['Sound & lighting', 'audiovisual', 'Equipment list, on-site technician'],
  cake: ['Cake', 'cake', 'Tasting, size per guest, delivery'],
  beauty: ['Makeup & hair', 'beauty', 'Trial session, team size'],
  rentals: ['Rentals', 'rentals', 'Chairs, canopies, generator, delivery'],
  attire: ['Attire & aso-ebi', null, 'Fabric samples, collection deadline'],
  security: ['Security', null, 'Licensed staff, gate plan'],
  printing: ['Printing & branding', null, 'Proofs before print, turnaround']
};

export interface Playbook {
  /** Typical spend per guest in naira (low, high) before city adjustment. */
  perGuest: [number, number];
  tasks: string[];
  /** [name, % of budget, why] — must total 100. */
  budget: Array<[string, number, string]>;
  vendors: string[];
}

const P = (perGuest: [number, number], tasks: string, budget: Playbook['budget'], vendors: string): Playbook => ({
  perGuest,
  tasks: tasks.split(' '),
  budget,
  vendors: vendors.split(' ')
});

export const PLAYBOOKS: Record<EventType, Playbook> = {
  wedding: P([25_000, 60_000], 'budget guestlist venue caterer decor photo mc makeup invites deposits cake headcount programme seating confirm pointperson',
  [['Venue', 22, 'Hall or garden with power backup'], ['Catering', 30, 'Food and drinks per head'], ['Decor', 13, 'Hall, stage and tables'], ['Photo & film', 9, 'Coverage of the day'], ['Entertainment', 7, 'MC and DJ or band'], ['Attire & beauty', 9, 'Outfits, makeup and hair'], ['Contingency', 10, 'Buffer for overruns']],
  'venue catering decor photography entertainment cake beauty'),
  traditional_wedding: P([20_000, 45_000], 'families budget guestlist venue caterer asoebi decor mc photo invites deposits rentals headcount programme seating confirm pointperson',
  [['Venue & canopies', 18, 'Hall or compound setup'], ['Catering', 32, 'Food and drinks per head'], ['Decor', 12, 'Stage and family seating'], ['Attire & aso-ebi', 12, 'Couple’s outfits and fabric'], ['MC / Alaga & music', 8, 'Programme and entertainment'], ['Photo & film', 8, 'Coverage of the day'], ['Contingency', 10, 'Buffer for extra guests']],
  'venue catering decor entertainment photography attire rentals'),
  birthday: P([8_000, 20_000], 'guestlist venue caterer decor dj cake invites photo headcount confirm',
  [['Venue', 25, 'Space for your headcount'], ['Food & drinks', 38, 'The biggest cost'], ['Decor', 12, 'Theme and lighting'], ['Cake', 6, 'Sized to guests'], ['Entertainment', 9, 'DJ or games'], ['Contingency', 10, 'Drinks always run out']],
  'venue catering decor cake entertainment photography'),
  anniversary: P([10_000, 25_000], 'guestlist venue caterer decor photo invites cake programme confirm',
  [['Venue', 28, 'Restaurant or hall'], ['Food & drinks', 37, 'Per-head dining'], ['Decor', 12, 'Tables and flowers'], ['Photography', 8, 'Keepsake photos'], ['Cake', 5, 'Celebration cake'], ['Contingency', 10, 'Buffer']],
  'venue catering decor photography cake'),
  party: P([6_000, 15_000], 'guestlist caterer dj decor rentals neighbours invites confirm',
  [['Food & drinks', 45, 'The main cost'], ['DJ & sound', 20, 'DJ with speakers'], ['Decor & lighting', 12, 'Simple theme'], ['Rentals', 10, 'Chairs, coolers, generator'], ['Contingency', 13, 'Extra drinks and ice']],
  'catering entertainment decor rentals'),
  naming: P([5_000, 12_000], 'guestlist officiant caterer rentals souvenirs invites cake photo confirm',
  [['Catering', 42, 'Food and drinks'], ['Rentals', 15, 'Canopies and chairs'], ['Souvenirs', 13, 'Guest keepsakes'], ['Cake', 6, 'For the celebration'], ['Photography', 9, 'Family photos'], ['Contingency', 15, 'Extra guests often arrive']],
  'catering rentals photography cake'),
  graduation: P([7_000, 18_000], 'guestlist venue caterer decor photo invites cake confirm',
  [['Venue', 22, 'Hall or restaurant'], ['Food & drinks', 40, 'Per-head catering'], ['Decor', 10, 'Simple theme'], ['Photography', 10, 'Gown photos'], ['Cake', 6, 'Celebration cake'], ['Contingency', 12, 'Buffer']],
  'venue catering photography decor cake'),
  corporate: P([15_000, 35_000], 'agenda budget venue caterer sound photo invites security programme rehearsal confirm',
  [['Venue', 28, 'Conference hall or hotel'], ['Catering', 25, 'Tea breaks and lunch'], ['AV & production', 20, 'Sound, screens, stage'], ['Branding & printing', 8, 'Badges and banners'], ['Photography', 6, 'Coverage for comms'], ['Contingency', 13, 'Overruns and late changes']],
  'venue catering audiovisual photography printing security'),
  concert: P([5_000, 15_000], 'budget venue talent tickets sound promo security rentals programme rehearsal confirm pointperson',
  [['Venue', 22, 'Capacity and licensing'], ['Talent', 25, 'Artist fees and riders'], ['Sound, light & stage', 22, 'The production'], ['Promotion', 10, 'Ads and creators'], ['Security & gate', 9, 'Crowd control'], ['Contingency', 12, 'Weather and overruns']],
  'venue audiovisual entertainment security printing'),
  community: P([3_000, 8_000], 'budget guestlist venue caterer rentals sound security programme confirm',
  [['Venue & rentals', 25, 'Field, hall or canopies'], ['Food & drinks', 35, 'Simple, shareable'], ['Sound', 15, 'PA for speeches and music'], ['Security', 10, 'Crowd and traffic'], ['Contingency', 15, 'Turnout is unpredictable']],
  'venue catering rentals audiovisual security'),
  custom: P([8_000, 20_000], 'budget guestlist venue caterer decor invites programme confirm',
  [['Venue', 30, 'Space for your headcount'], ['Food & drinks', 35, 'Per-head catering'], ['Decor', 12, 'Setup and lighting'], ['Extras', 11, 'Sound, photos, souvenirs'], ['Contingency', 12, 'Buffer']],
  'venue catering decor photography')
};

/** Rough cost level vs. the national baseline. Indicative only. */
export const CITY_TIER: Record<string, number> = {
  lagos: 1.25,
  abuja: 1.2,
  'port harcourt': 1.1,
  ibadan: 0.95,
  enugu: 0.95,
  'benin city': 0.95,
  calabar: 0.95,
  owerri: 0.95,
  abeokuta: 0.9,
  kano: 0.9
};