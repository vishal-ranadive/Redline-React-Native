/**
 * Global constants for gear type images
 * Using Cloudinary URLs for better PDF generation support
 */
export const GEAR_IMAGE_URLS = {
  jacket: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844940/RedLine/rcyfyv9ksduotb8ctzh4.jpg',
  jacket_liner: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844941/RedLine/mo341rdnr9uzrilxpj1e.jpg',
  pants: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844939/RedLine/bmudwf2fzcmajvaovtt7.jpg',
  pants_liner: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844939/RedLine/pcv4yipjmwn87fwnm731.jpg',
  helmet: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844940/RedLine/pmn1uatdfhw7blcjdj92.jpg',
  hood: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844939/RedLine/ru1rbjqn2txzlvktdvyp.jpg',
  gloves: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844939/RedLine/iwgapecwptmk50xtgrmd.jpg',
  boots: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764844940/RedLine/urbfdqrkibqwqxld5ex3.jpg',
  other: 'https://res.cloudinary.com/dwwykeft2/image/upload/v1764846369/RedLine/deetngagy8pvhaymcsf4.jpg', // fallback to jacket
} as const;

/**
 * Global constants for local gear icons
 * Using require() for local asset images
 */
export const GEAR_ICONS = {
  jacket: require('../assets/gears/jacket.jpg'),
  jacket_liner: require('../assets/gears/jacket_shell.jpg'),
  pants: require('../assets/gears/pants.jpg'),
  pants_liner: require('../assets/gears/pants_shell.jpg'),
} as const;

/**
 * Get appropriate local gear icon based on gear type
 * @param gearType - The gear type string (e.g., "JACKET", "PANT LINER")
 * @returns The appropriate gear icon or default jacket icon
 */
export const getGearIconImage = (gearType: string | null) => {
  if (!gearType) return GEAR_ICONS.jacket; // default

  const type = gearType.toUpperCase();
  if (type.includes('JACKET') && type.includes('LINER')) return GEAR_ICONS.jacket_liner;
  if (type.includes('JACKET')) return GEAR_ICONS.jacket;
  if (type.includes('PANT') && type.includes('LINER')) return GEAR_ICONS.pants_liner;
  if (type.includes('PANT')) return GEAR_ICONS.pants;

  return GEAR_ICONS.jacket; // default
};

