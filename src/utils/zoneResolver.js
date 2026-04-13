function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const COVERED_ZONE_CATALOG = [
  {
    key: 'valencia',
    displayName: 'Valencia',
    aliases: ['valencia'],
    withinServiceArea: true
  },
  {
    key: 'la_eliana',
    displayName: 'La Eliana',
    aliases: ['la eliana', 'l eliana', 'leliana'],
    withinServiceArea: true
  }
];

function containsWholePhrase(text, phrase) {
  return new RegExp(`(^|\\s)${phrase.replace(/\s+/g, '\\s+')}($|\\s)`, 'i').test(text);
}

function resolveZone({ locationHint, zoneValue }) {
  const searchText = normalizeText(zoneValue || locationHint);

  if (!searchText) {
    return null;
  }

  const matchedZone = COVERED_ZONE_CATALOG.find((zone) =>
    zone.aliases.some((alias) => containsWholePhrase(searchText, normalizeText(alias)))
  );

  if (!matchedZone) {
    return null;
  }

  return {
    key: matchedZone.key,
    displayName: matchedZone.displayName,
    normalizedName: normalizeText(matchedZone.displayName),
    withinServiceArea: matchedZone.withinServiceArea
  };
}

module.exports = {
  resolveZone,
  normalizeText
};
