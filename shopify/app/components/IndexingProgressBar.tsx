import { useEffect, useState } from 'react';
import styles from './SyncProgressBar.module.css';

interface IndexingStatus {
  shopDomain: string;
  status: 'idle' | 'in_progress' | 'completed' | 'error';
  totalProducts?: number;
  processedProducts?: number;
  progress?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  duration?: number;
  message: string;
  error?: string | null;
}

interface IndexingProgressBarProps {
  indexingStatus: IndexingStatus | null;
}

export function IndexingProgressBar({ indexingStatus }: IndexingProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!indexingStatus) return;

    const progress = indexingStatus.progress !== undefined 
      ? indexingStatus.progress 
      : (indexingStatus.totalProducts && indexingStatus.processedProducts
          ? Math.round((indexingStatus.processedProducts / indexingStatus.totalProducts) * 100)
          : 0);

    setDisplayProgress(progress);
    
    // Smooth animation
    const targetProgress = Math.max(0, Math.min(100, progress));
    const startProgress = animationProgress;
    const difference = targetProgress - startProgress;
    const duration = 500; // 500ms animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easedProgress = startProgress + (difference * progressRatio);
      setAnimationProgress(easedProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimationProgress(targetProgress);
      }
    };

    requestAnimationFrame(animate);
  }, [indexingStatus, animationProgress]);

  if (!indexingStatus) {
    return null;
  }

  const getStatusIcon = () => {
    if (indexingStatus.status === 'completed') return '✅';
    if (indexingStatus.status === 'in_progress') return '🧠';
    if (indexingStatus.status === 'error') return '❌';
    return '⏸️';
  };

  const getStatusMessage = () => {
    if (indexingStatus.status === 'in_progress') {
      return indexingStatus.message || 'Generating embeddings...';
    }
    if (indexingStatus.status === 'completed') {
      return indexingStatus.message || 'Embeddings generated successfully!';
    }
    if (indexingStatus.status === 'error') {
      return `Indexing failed: ${indexingStatus.error || 'Unknown error'}`;
    }
    return indexingStatus.message || 'Indexing products...';
  };

  const getProgressColor = () => {
    if (indexingStatus.status === 'completed') {
      return 'linear-gradient(90deg, #1a7f37 0%, #2ea043 100%)'; // Green
    }
    if (indexingStatus.status === 'error') {
      return 'linear-gradient(90deg, #b42318 0%, #d92d20 100%)'; // Red
    }
    return 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)'; // Blue for in_progress
  };

  const getProgress = () => {
    if (indexingStatus.progress !== undefined && indexingStatus.progress >= 0 && indexingStatus.progress <= 100) {
      return indexingStatus.progress;
    }
    if (indexingStatus.totalProducts !== undefined && indexingStatus.processedProducts !== undefined && indexingStatus.totalProducts > 0) {
      return Math.round((indexingStatus.processedProducts / indexingStatus.totalProducts) * 100);
    }
    return 0;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const progress = getProgress();
  const counts = indexingStatus.totalProducts !== undefined && indexingStatus.processedProducts !== undefined
    ? { processed: indexingStatus.processedProducts, total: indexingStatus.totalProducts }
    : null;

  // Don't show if status is idle
  if (indexingStatus.status === 'idle') {
    return null;
  }

  return (
    <div className={styles.syncProgressContainer}>
      <s-box padding="base" borderRadius="base">
        <div className={styles.syncProgressCard}>
          <div className={styles.syncHeader}>
            <div className={styles.syncTitle}>
              <span className={styles.statusIcon}>{getStatusIcon()}</span>
              <s-heading>Indexing Status</s-heading>
            </div>
          </div>

          <div className={styles.syncContent}>
            <div className={styles.statusMessage}>
              <s-text>{getStatusMessage()}</s-text>
            </div>

            {(indexingStatus.status === 'in_progress' || indexingStatus.status === 'completed') && (
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div 
                    className={`${styles.progressFill} ${indexingStatus.status === 'completed' ? styles.progressComplete : ''}`}
                    style={{ 
                      width: `${Math.round(animationProgress)}%`,
                      background: getProgressColor()
                    }}
                  />
                </div>
                <div className={styles.progressInfo}>
                  <div className={styles.progressText}>
                    {counts ? (
                      <span>{progress}% ({counts.processed}/{counts.total} products)</span>
                    ) : (
                      <span>{progress}%</span>
                    )}
                  </div>
                  {indexingStatus.duration !== undefined && indexingStatus.duration > 0 && (
                    <div className={styles.durationText}>
                      <span className={styles.durationLabel}>Duration:</span>
                      <span className={styles.durationValue}>{formatDuration(indexingStatus.duration)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </s-box>
    </div>
  );
}

