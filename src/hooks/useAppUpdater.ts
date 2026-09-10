import { useCallback, useRef, useState } from 'react';
import { check, type DownloadEvent, type Update } from '@tauri-apps/plugin-updater';

export interface UpdateInfo {
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
}

/**
 * OTA update manager (Tauri v2 updater plugin).
 * Silent checks stay quiet (offline / up-to-date); only real findings surface.
 */
export function useAppUpdater() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upToDate, setUpToDate] = useState(false);
  const updateRef = useRef<Update | null>(null);
  const totalRef = useRef(0);
  const doneRef = useRef(0);

  const checkForUpdates = useCallback(async (silent = false) => {
    setChecking(true);
    if (!silent) {
      setError(null);
      setUpToDate(false);
    }
    try {
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateInfo({
          currentVersion: update.currentVersion,
          version: update.version,
          date: update.date ?? undefined,
          body: update.body ?? undefined,
        });
        setUpdateAvailable(true);
      } else if (!silent) {
        setUpToDate(true);
      }
    } catch (e) {
      if (!silent) setError(`Échec de la vérification : ${String(e)}`);
    } finally {
      setChecking(false);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update || downloading) return;
    setDownloading(true);
    setDownloadProgress(0);
    setError(null);
    totalRef.current = 0;
    doneRef.current = 0;
    try {
      await update.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === 'Started') {
          totalRef.current = event.data.contentLength ?? 0;
          doneRef.current = 0;
          setDownloadProgress(0);
        } else if (event.event === 'Progress') {
          doneRef.current += event.data.chunkLength;
          if (totalRef.current > 0) {
            setDownloadProgress(Math.min(99, Math.round((doneRef.current / totalRef.current) * 100)));
          }
        } else if (event.event === 'Finished') {
          setDownloadProgress(100);
        }
      });
      // installMode "passive" + restartAfterInstall: the app restarts itself.
    } catch (e) {
      setError(`Échec de l'installation : ${String(e)}`);
      setDownloading(false);
    }
  }, [downloading]);

  return {
    checking,
    updateAvailable,
    updateInfo,
    downloadProgress,
    downloading,
    error,
    upToDate,
    checkForUpdates,
    installUpdate,
  };
}
