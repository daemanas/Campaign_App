// Bundled demo artwork. Picked/user images are stored as `img://<key>` refs and
// resolved by SmartImage, so they never collide with these static assets.
export const Images = {
  daemAvatar: require('./images/daem_avatar.jpg'),
  profileBanner: require('./images/profile_banner.jpg'),
  onboardingHero: require('./images/onboarding_hero.jpg'),
  cleanRivers: require('./images/clean_rivers.jpg'),
  ruralClassroom: require('./images/rural_classroom.jpg'),
  strayDog: require('./images/stray_dog.jpg'),
  healthCamp: require('./images/health_camp.jpg'),
  treePlanting: require('./images/tree_planting.jpg'),
  foodDrive: require('./images/food_drive.jpg'),
  womenTraining: require('./images/women_training.jpg'),
  solarVillage: require('./images/solar_village.jpg'),
  avatarPriya: require('./images/avatar_priya.jpg'),
  avatarRahul: require('./images/avatar_rahul.jpg'),
  avatarSneha: require('./images/avatar_sneha.jpg'),
  avatarAman: require('./images/avatar_aman.jpg'),
};

// Bundled demo artwork. The numeric value of a `require()` is only stable for
// one build, so state stores the name instead: `asset://cleanRivers`.
export const ASSET_SCHEME = 'asset://';

export function artRef(name) {
  return ASSET_SCHEME + name;
}

export function isArtRef(ref) {
  return typeof ref === 'string' && ref.startsWith(ASSET_SCHEME);
}

export function assetSource(ref) {
  return isArtRef(ref) ? Images[ref.slice(ASSET_SCHEME.length)] || null : null;
}

// Named fallback artwork per cause, used when a campaign has no cover image.
export const CategoryArt = {
  Environment: artRef('cleanRivers'),
  Education: artRef('ruralClassroom'),
  Health: artRef('healthCamp'),
  Animals: artRef('strayDog'),
  Community: artRef('foodDrive'),
};
