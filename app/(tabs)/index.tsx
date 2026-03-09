import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('buildings').select('count');
      if (error) {
        console.error('Supabase error:', error.message);
        setConnected(false);
      } else {
        setConnected(true);
      }
    };
    testConnection();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {connected === null
          ? 'Testing connection...'
          : connected
            ? 'Connected to Supabase'
            : 'Connection failed — check console'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18, color: 'white' },
});
