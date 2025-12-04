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

