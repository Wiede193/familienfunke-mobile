// Familienfunke's shared visual language.
// A warm, sunny background plus restrained teal actions keeps contrast clear.
// Legacy aliases intentionally coexist so every feature uses the same palette.
export const FAMILY_COLORS = Object.freeze({
  bg:'#FFF9F0',
  background:'#FFF9F0',
  cream:'#FFF9F0',
  white:'#FFFFFF',
  paper:'#FFFFFF',
  ink:'#253D43',
  muted:'#52666B',
  accent:'#0B777A',
  teal:'#0B777A',
  accentDark:'#075A60',
  tealDark:'#075A60',
  dark:'#075A60',
  pale:'#E8F3E9',
  mint:'#E8F3E9',
  line:'#EAE4D9',
  coral:'#EE7867',
  coralDeep:'#B9474C',
  peach:'#F9D9C9',
  sun:'#FFDD79',
  sunny:'#FFDD79',
  yellow:'#FFDD79',
  sunPale:'#FFF0B8',
  lavender:'#F2EEFF',
  warn:'#FFF1D6',
  warning:'#FFF1D6',
  warningText:'#75521D',
  danger:'#9B493F'
});

export const FAMILY_RADII = Object.freeze({
  card:22,
  hero:25,
  button:15,
  input:15,
  chip:22
});


// Shared typography and spacing for the six-part interface refresh. Preserve
// the established sunny palette and accessible high-contrast action colors.
export const FAMILY_TYPE = Object.freeze({
  display:30,
  title:23,
  section:19,
  card:16,
  body:15,
  small:14,
  meta:13,
  weightDisplay:'800',
  weightTitle:'800',
  weightBody:'400'
});
export const FAMILY_SPACE = Object.freeze({
  xs:4,sm:8,md:12,base:16,lg:20,xl:24,xxl:32,
  touch:48,
  screen:18
});
export const FAMILY_SURFACE = Object.freeze({
  border:FAMILY_COLORS.line,
  selected:FAMILY_COLORS.sunPale,
  canvas:FAMILY_COLORS.bg,
  card:FAMILY_COLORS.paper,
  mutedCard:'#FCF8EF',
  softTeal:FAMILY_COLORS.mint
});
