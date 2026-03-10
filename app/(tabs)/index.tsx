import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '../../constants/Theme';

export default function HomeScreen() {
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    // TODO: search buildings/rooms
  };

  const handleQRScan = () => {
    // TODO: open QR scanner
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>TUKE Navigator</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Map</Text>
        <Text style={styles.mapPlaceholderSub}>Indoor floor plans will be displayed here</Text>
      </View>

      <View style={styles.bottomPanel}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search building or room..."
          placeholderTextColor={Colors.gray300}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.qrButton} onPress={handleQRScan} activeOpacity={0.8}>
            <Text style={styles.qrButtonText}>Scan QR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.black,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.gold,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
    margin: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray500,
  },
  mapPlaceholderText: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.gray300,
  },
  mapPlaceholderSub: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
  bottomPanel: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  searchInput: {
    height: 52,
    backgroundColor: Colors.gray700,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Fonts.sizes.md,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  searchButton: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.gold,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.black,
  },
  qrButton: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButtonText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.black,
  },
});
