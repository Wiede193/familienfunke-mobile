import React from 'react';
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Reine Anzeige vorhandener, bereits für den jeweiligen Betrachter zugänglicher Fotos.
// Keine Uploads, kein Teilen, keine neuen Storage-/Supabase-Berechtigungen.
export default function MomentViewer({ photos = [], urls = {}, activeId = null, onSelect, onClose, isOwner = false }) {
  const available = photos.filter(photo =>
    photo?.id && typeof urls?.[photo.id] === 'string' && urls[photo.id] &&
    (isOwner || photo.moderation_status === 'approved')
  );
  const index = available.findIndex(photo => photo.id === activeId);
  const photo = index >= 0 ? available[index] : null;
  const caption = photo?.caption?.trim() || 'Ein besonderer Familienmoment.';
  const status = photo?.moderation_status === 'approved'
    ? '✓ Freigegeben'
    : photo?.moderation_status === 'pending'
      ? '⌛ In Prüfung'
      : 'Nicht freigegeben';

  return (
    <Modal visible={!!photo} animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>✦ FAMILIENFUNKE</Text>
            <Text style={styles.heading}>{isOwner ? 'Unsere Momente' : 'Familienmomente'}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fotoansicht schließen"
            onPress={onClose}
            style={({ pressed }) => [styles.close, pressed && styles.pressed]}
          >
            <Text style={styles.closeText}>✕  Schließen</Text>
          </Pressable>
        </View>

        <View style={styles.pictureArea}>
          {photo ? (
            <Image
              source={{ uri: urls[photo.id] }}
              style={styles.picture}
              resizeMode="contain"
              accessibilityLabel={photo.caption?.trim() || 'Familienfoto'}
            />
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.count}>{photo ? `${index + 1} VON ${available.length} FOTOS` : ''}</Text>
          <ScrollView style={styles.captionScroll} contentContainerStyle={{ paddingVertical: 3 }}>
            <Text style={styles.caption}>{caption}</Text>
          </ScrollView>
          {isOwner && photo ? <Text style={styles.moderation}>{status}</Text> : null}
          <View style={styles.navigation}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Vorheriges Foto"
              accessibilityState={{ disabled: index <= 0 }}
              disabled={index <= 0}
              onPress={() => onSelect(available[index - 1].id)}
              style={({ pressed }) => [styles.navButton, index <= 0 && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.navLabel}>‹  Zurück</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nächstes Foto"
              accessibilityState={{ disabled: index < 0 || index >= available.length - 1 }}
              disabled={index < 0 || index >= available.length - 1}
              onPress={() => onSelect(available[index + 1].id)}
              style={({ pressed }) => [styles.navButton, index >= available.length - 1 && styles.disabled, pressed && styles.pressed]}
            >
              <Text style={styles.navLabel}>Weiter  ›</Text>
            </Pressable>
          </View>
          <Text style={styles.privacy}>Nur bestätigte Kontakte sehen freigegebene Familienfotos.</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#203A3F' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  eyebrow: { color: '#FFDC99', letterSpacing: 1.6, fontSize: 10, fontWeight: '900', marginBottom: 7 },
  heading: { color: '#FFF9EF', fontWeight: '900', fontSize: 23, letterSpacing: -.5 },
  close: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 16, backgroundColor: '#395559' },
  closeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  pictureArea: { flex: 1, minHeight: 120, justifyContent: 'center', paddingHorizontal: 10 },
  picture: { width: '100%', height: '100%' },
  footer: { backgroundColor: '#FFF5E7', borderTopLeftRadius: 27, borderTopRightRadius: 27, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 17 },
  count: { fontSize: 11, fontWeight: '900', color: '#A06A2B', letterSpacing: 1.3, marginBottom: 9 },
  captionScroll: { maxHeight: 118, marginBottom: 9 },
  caption: { color: '#243E43', fontSize: 16, lineHeight: 24, fontWeight: '700' },
  moderation: { color: '#5E7272', fontSize: 12, fontWeight: '800', marginBottom: 12 },
  navigation: { flexDirection: 'row', gap: 12, marginTop: 10 },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 16, minHeight: 49, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#D9DED6' },
  navLabel: { color: '#075D67', fontSize: 14, fontWeight: '900' },
  disabled: { opacity: .32 },
  pressed: { opacity: .7 },
  privacy: { marginTop: 12, textAlign: 'center', color: '#687E80', fontSize: 11, lineHeight: 16 },
});
