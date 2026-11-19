// Familienfunke: lokale Hinweis-Zähler für die private Beta.
// Die Lesestände enthalten KEINE Nachrichten, Bilder, Namen oder Inhalte.
// Speicherung erfolgt pro angemeldetem Konto ausschließlich auf diesem Gerät.
// Eine spätere geräteübergreifende Ungelesen-Synchronisierung benötigt
// eigene, RLS-geschützte Tabellen und geprüfte serverseitige Schreibwege.
const STORAGE_KEY = '@familienfunke:hinweise:v1:';

export function newSeenState(userId, now = Date.now()) {
  return { userId, baseline: now, discover: now, events: now, photos: now, chats: {} };
}
export function storageKey(userId) { return STORAGE_KEY + userId; }

export function isValidSeenState(value, userId) {
  return !!value && value.userId === userId &&
    Number.isFinite(value.baseline) && Number.isFinite(value.discover) &&
    Number.isFinite(value.events) && Number.isFinite(value.photos) &&
    value.chats && typeof value.chats === 'object' && !Array.isArray(value.chats);
}
const timeOf = value => {
  const time = Date.parse(String(value || ''));
  return Number.isFinite(time) ? time : 0;
};
const lowerRegion = region => String(region || '').trim().toLocaleLowerCase('de-DE');
export function computeActivity({ me, db, contacts, matches, myProfile, seen, blockedUserIds = [] }) {
  const zero = { discover: 0, contacts: 0, chat: 0, events: 0, profile: 0, incomingRequests: 0, newPhotos: 0, unreadMessages: 0, newFamilies: 0, newEvents: 0, eventRequests: 0, chatCounts: {} };
  if (!me || !seen || seen.userId !== me) return zero;
  const blocked = new Set(blockedUserIds);
  const accepted = (contacts || []).filter(c => c.status === 'accepted')
    .filter(c => !blocked.has(c.sender_id === me ? c.recipient_id : c.sender_id));
  const acceptedIds = new Set(accepted.map(c => c.id));
  const acceptedUsers = new Set(accepted.map(c => c.sender_id === me ? c.recipient_id : c.sender_id));
  const incomingRequests = (contacts || []).filter(c => c.status === 'pending' && c.recipient_id === me && !blocked.has(c.sender_id)).length;

  // Im Chat bleiben Nachrichten ungelesen, bis das *jeweilige* Gespräch geöffnet wird.
  const chatCounts = {};
  let unreadMessages = 0;
  for (const message of (db?.messages || [])) {
    if (!acceptedIds.has(message.contact_id) || message.sender_id === me) continue;
    const lastRead = Number.isFinite(seen.chats?.[message.contact_id])
      ? seen.chats[message.contact_id] : seen.baseline;
    if (timeOf(message.created_at) > lastRead) {
      chatCounts[message.contact_id] = (chatCounts[message.contact_id] || 0) + 1;
      unreadMessages++;
    }
  }

  // Nur freigegebene Bilder von bestätigten Kontakten, keine eigenen oder blockierten.
  const newPhotos = (db?.photos || []).filter(p =>
    p.owner_id !== me && acceptedUsers.has(p.owner_id) &&
    p.moderation_status === 'approved' && timeOf(p.created_at) > seen.photos
  ).length;

  // Dieselbe *angegebene grobe Region* ist keine echte Standort-Entfernungsberechnung.
  const region = lowerRegion(myProfile?.region_label);
  const newFamilies = region ? (matches || []).filter(p =>
    !blocked.has(p.user_id) && p.match > 0 &&
    lowerRegion(p.region_label) === region && timeOf(p.created_at) > seen.discover
  ).length : 0;

  const now = Date.now();
  const events = (db?.events || []);
  const visibleEvents = events.filter(e =>
    e.organizer_id !== me && e.moderation_status === 'approved' &&
    timeOf(e.ends_at) > now && timeOf(e.created_at) > seen.events &&
    (e.visibility !== 'contacts' || acceptedUsers.has(e.organizer_id))
  );
  const eventIds = new Set(events.filter(e => e.organizer_id === me).map(e => e.id));
  const eventRequests = (db?.eventRequests || []).filter(req =>
    eventIds.has(req.event_id) && req.status === 'requested'
  ).length;

  return {
    discover: newFamilies,
    contacts: incomingRequests + newPhotos,
    chat: unreadMessages,
    events: visibleEvents.length + eventRequests,
    profile: 0,
    incomingRequests,
    newPhotos,
    unreadMessages,
    newFamilies,
    newEvents: visibleEvents.length,
    eventRequests,
    chatCounts,
  };
}

export function markSeen(state, type, now = Date.now(), contactId = null) {
  if (!state) return null;
  if (type === 'chat' && contactId) return {
    ...state, chats: { ...state.chats, [contactId]: now }
  };
  if (['discover', 'events', 'photos'].includes(type)) return {
    ...state, [type]: now
  };
  return state;
}
