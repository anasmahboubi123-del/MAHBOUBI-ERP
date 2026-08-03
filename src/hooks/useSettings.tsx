'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';

export type SettingsMap = Record<string, any>;

interface SettingsContextType {
  settings: SettingsMap;
  loading: boolean;
  error: string | null;
  updateSetting: (key: string, value: any) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

// القيمة الافتراضية: loading = false (وليس true!)
const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  loading: false,
  error: null,
  updateSetting: async () => {},
  refreshSettings: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.from('settings').select('key, value');

      if (error) {
        console.error('❌ Error fetching settings:', error);
        setError(error.message);
        setSettings({});
        return;
      }

      const map: SettingsMap = {};
      data?.forEach((row: any) => {
        map[row.key] = row.value;
      });

      console.log('✅ Settings loaded:', Object.keys(map));
      setSettings(map);
    } catch (err: any) {
      console.error('❌ Exception fetching settings:', err);
      setError(err.message);
    } finally {
      setLoading(false); // ← دائماً يُوقف التحميل
    }
  }, []);

  const updateSetting = useCallback(async (key: string, value: any) => {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_by: 'admin' }, { onConflict: 'key' });

    if (error) {
      console.error('❌ Error updating setting:', error);
      throw error;
    }

    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider
      value={{ settings, loading, error, updateSetting, refreshSettings: fetchSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

export function useSetting<T>(
  key: string,
  defaultValue: T
): [T, (val: T) => Promise<void>, boolean, string | null] {
  const { settings, updateSetting, loading, error } = useSettings();

  let value = defaultValue;
  if (settings[key] !== undefined && settings[key] !== null) {
    value = settings[key] as T;
  }

  const setValue = async (val: T) => {
    await updateSetting(key, val);
  };

  return [value, setValue, loading, error];
}