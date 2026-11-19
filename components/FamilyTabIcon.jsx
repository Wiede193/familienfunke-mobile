import React from 'react';
import { View } from 'react-native';

/**
 * Ruhige, selbst gezeichnete Linien-Symbole für die Hauptnavigation.
 * Bewusst ohne Emoji-Zeichen, Icon-Fonts oder neue native Abhängigkeiten,
 * damit die private Beta in Expo Go weiterhin leicht zu laden bleibt.
 */
export default function FamilyTabIcon({ name, color = '#74878A', size = 26 }) {
  const stroke = 2.1;
  const line = { position: 'absolute', backgroundColor: color, borderRadius: 3 };
  const outline = { position: 'absolute', borderWidth: stroke, borderColor: color };
  const drawing = (() => {
    switch (name) {
      case 'discover':
        return <>
          <View style={[outline, { width: 17, height: 17, borderRadius: 9, top: 2, left: 2 }]} />
          <View style={[line, { width: 11, height: stroke, top: 19, left: 16, transform: [{ rotate: '45deg' }] }]} />
        </>;
      case 'contacts':
        return <>
          <View style={[outline, { width: 9, height: 9, borderRadius: 5, top: 2, left: 3 }]} />
          <View style={[outline, { width: 9, height: 9, borderRadius: 5, top: 2, left: 17 }]} />
          <View style={[outline, { width: 13, height: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, top: 13, left: 1 }]} />
          <View style={[outline, { width: 13, height: 12, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, top: 13, left: 15 }]} />
        </>;
      case 'chat':
        return <>
          <View style={[outline, { width: 25, height: 19, borderRadius: 6, top: 2, left: 2 }]} />
          <View style={[line, { width: 7, height: stroke, top: 22, left: 7, transform: [{ rotate: '-48deg' }] }]} />
          <View style={[line, { width: 12, height: stroke, top: 9, left: 8 }]} />
          <View style={[line, { width: 8, height: stroke, top: 14, left: 8 }]} />
        </>;
      case 'events':
        return <>
          <View style={[outline, { width: 24, height: 23, borderRadius: 5, top: 4, left: 2 }]} />
          <View style={[line, { height: stroke, width: 20, left: 4, top: 11 }]} />
          <View style={[line, { height: 8, width: stroke, left: 8, top: 0 }]} />
          <View style={[line, { height: 8, width: stroke, left: 19, top: 0 }]} />
          <View style={[line, { height: 3, width: 3, left: 8, top: 17 }]} />
          <View style={[line, { height: 3, width: 3, left: 16, top: 17 }]} />
        </>;
      case 'profile':
        return <>
          <View style={[outline, { width: 12, height: 12, borderRadius: 6, top: 1, left: 8 }]} />
          <View style={[outline, { width: 24, height: 14, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, top: 15, left: 2 }]} />
        </>;
      default:
        return null;
    }
  })();
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width: 28, height: 29, transform: [{ scale: size / 28 }] }}
    >
      {drawing}
    </View>
  );
}
