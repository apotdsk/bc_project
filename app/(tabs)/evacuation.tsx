import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Colors, Fonts, Spacing, Radius } from '../../constants/Theme';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type EvacuationStatus = 'inactive' | 'test' | 'real';

export default function EvacuationScreen() {
  const { session } = useAuth();
  const [role, setRole] = useState<string>('student');
  const [evacuationStatus, setEvacuationStatus] = useState<EvacuationStatus>('inactive');
  const [adminExpanded, setAdminExpanded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchRole = async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (data) setRole(data.role);
    };
    fetchRole();
  }, [session]);

  // Pulse animation for active evacuation
  useEffect(() => {
    if (evacuationStatus !== 'inactive') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [evacuationStatus]);

  const isAdmin = role === 'admin';

  const toggleAdmin = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAdminExpanded(!adminExpanded);
  };

  const handleTriggerEvacuation = (type: 'test' | 'real') => {
    const label = type === 'test' ? 'TEST evacuation' : 'REAL evacuation';
    Alert.alert(
      `Trigger ${label}?`,
      type === 'real'
        ? 'This will send an emergency alert to ALL users in this building.'
        : 'This will start a test drill. Users will be notified it is a drill.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            setEvacuationStatus(type);
            setAdminExpanded(false);
          },
        },
      ]
    );
  };

  const handleStopEvacuation = () => {
    Alert.alert('Stop evacuation?', 'This will end the current evacuation.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', onPress: () => setEvacuationStatus('inactive') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.black} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Evacuation</Text>
        {evacuationStatus !== 'inactive' && (
          <Animated.View
            style={[
              styles.statusBadge,
              evacuationStatus === 'real' ? styles.badgeReal : styles.badgeTest,
              { opacity: pulseAnim },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {evacuationStatus === 'real' ? 'ACTIVE' : 'TEST DRILL'}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Map */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Evacuation Map</Text>
        {evacuationStatus !== 'inactive' && (
          <Animated.View style={[styles.mapOverlay, { opacity: pulseAnim }]}>
            <Text style={styles.mapOverlayText}>
              {evacuationStatus === 'real'
                ? 'FOLLOW THE EVACUATION ROUTE'
                : 'Test drill in progress'}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom panel */}
      <ScrollView style={styles.bottomPanel} contentContainerStyle={styles.bottomPanelContent}>
        {/* Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>Instructions</Text>
          <Text style={styles.instructionText}>
            1. Scan nearest QR code{'\n'}
            2. Follow the highlighted route{'\n'}
            3. Proceed to the nearest exit{'\n'}
            4. Gather at assembly point
          </Text>
        </View>

        {/* Active evacuation stop button — always visible */}
        {isAdmin && evacuationStatus !== 'inactive' && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopEvacuation}
            activeOpacity={0.8}
          >
            <Text style={styles.stopButtonText}>Stop Evacuation</Text>
          </TouchableOpacity>
        )}

        {/* Collapsible admin controls */}
        {isAdmin && (
          <View style={styles.adminSection}>
            <TouchableOpacity style={styles.adminHeader} onPress={toggleAdmin} activeOpacity={0.8}>
              <Text style={styles.adminTitle}>Admin Controls</Text>
              <Text style={styles.adminChevron}>{adminExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {adminExpanded && (
              <View style={styles.adminContent}>
                {evacuationStatus === 'inactive' && (
                  <>
                    <TouchableOpacity
                      style={styles.testButton}
                      onPress={() => handleTriggerEvacuation('test')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.testButtonText}>Start Test Drill</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.realButton}
                      onPress={() => handleTriggerEvacuation('real')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.realButtonText}>Trigger Real Evacuation</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={styles.analyticsButton} activeOpacity={0.8}>
                  <Text style={styles.analyticsButtonText}>Drill Analytics</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: Fonts.weights.bold,
    color: Colors.gold,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  badgeReal: {
    backgroundColor: Colors.emergencyRed,
  },
  badgeTest: {
    backgroundColor: Colors.warningOrange,
  },
  statusBadgeText: {
    color: Colors.white,
    fontSize: Fonts.sizes.sm,
    fontWeight: Fonts.weights.bold,
  },
  mapPlaceholder: {
    height: 280,
    backgroundColor: Colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
    margin: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.gray500,
    position: 'relative',
  },
  mapPlaceholderText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.bold,
    color: Colors.gray300,
  },
  mapOverlay: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(211, 47, 47, 0.9)',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  mapOverlayText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    letterSpacing: 1,
  },
  bottomPanel: {
    flex: 1,
  },
  bottomPanelContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  instructionCard: {
    backgroundColor: Colors.gray700,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.emergencyRed,
  },
  instructionTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.emergencyRed,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  instructionText: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray200,
    lineHeight: 26,
  },
  adminSection: {
    backgroundColor: Colors.gray700,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray500,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  adminTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
  },
  adminChevron: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray300,
  },
  adminContent: {
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.sm,
  },
  testButton: {
    height: 52,
    backgroundColor: Colors.warningOrange,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
  },
  realButton: {
    height: 52,
    backgroundColor: Colors.emergencyRed,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
  },
  stopButton: {
    height: 52,
    backgroundColor: Colors.emergencyRed,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  stopButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.bold,
    color: Colors.white,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  analyticsButton: {
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  analyticsButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.semibold,
    color: Colors.gold,
  },
});
