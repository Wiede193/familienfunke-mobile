// Familienfunke's shared visual language.
// A warm, sunny background plus restrained teal actions keeps contrast clear.
// Legacy aliases intentionally coexist so every feature uses the same palette.
export const FAMILY_COLORS = Object.freeze({
  bg:'#FFF8F2',
  background:'#FFF8F2',
  cream:'#FFF8F2',
  white:'#FFFFFF',
  paper:'#FFFFFF',
  ink:'#293E3D',
  muted:'#526562',
  accent:'#146F68',
  teal:'#146F68',
  accentDark:'#0B5751',
  tealDark:'#0B5751',
  dark:'#0B5751',
  pale:'#E8F2E8',
  mint:'#E8F2E8',
  line:'#E9DED4',
  coral:'#E98A76',
  coralDeep:'#B9474C',
  peach:'#F8DFD2',
  sun:'#F8D68A',
  sunny:'#F8D68A',
  yellow:'#F8D68A',
  sunPale:'#FFF1D4',
  lavender:'#F2EEFF',
  warn:'#FFF1D6',
  warning:'#FFF1D6',
  warningText:'#75521D',
  danger:'#9B493F'
});

export const FAMILY_RADII = Object.freeze({
  card:20,
  hero:24,
  button:16,
  input:16,
  chip:24
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

// Flat shared surfaces keep elevation subtle and touch targets consistent.
// Spread these into StyleSheet declarations; screen-specific layout stays local.
export const FAMILY_UI=Object.freeze({
  card:Object.freeze({backgroundColor:FAMILY_COLORS.paper,borderRadius:FAMILY_RADII.card,borderWidth:1,borderColor:FAMILY_COLORS.line}),
  primary:Object.freeze({backgroundColor:FAMILY_COLORS.accentDark,borderRadius:FAMILY_RADII.button,minHeight:FAMILY_SPACE.touch,justifyContent:'center',alignItems:'center'}),
  secondary:Object.freeze({backgroundColor:FAMILY_COLORS.paper,borderRadius:FAMILY_RADII.button,borderWidth:1.5,borderColor:FAMILY_COLORS.accentDark,minHeight:FAMILY_SPACE.touch,justifyContent:'center',alignItems:'center'}),
  field:Object.freeze({backgroundColor:FAMILY_COLORS.paper,borderRadius:FAMILY_RADII.input,borderColor:'#A5BEB4',borderWidth:1.5,minHeight:FAMILY_SPACE.touch}),
  motif:Object.freeze({nature:FAMILY_COLORS.mint,play:FAMILY_COLORS.sunPale,discover:FAMILY_COLORS.lavender,community:FAMILY_COLORS.peach})
});
