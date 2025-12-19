import classNames from 'classnames';
import styles from './Loader.module.scss';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function Loader({ size = 'md', text, fullScreen = false }: LoaderProps) {
  const loaderClasses = classNames(styles.loader, {
    [styles.fullScreen]: fullScreen,
  });

  const spinnerClasses = classNames(styles.spinner, {
    [styles.sm]: size === 'sm',
    [styles.md]: size === 'md',
    [styles.lg]: size === 'lg',
  });

  return (
    <div className={loaderClasses}>
      <div className={styles.content}>
        <div className={spinnerClasses}>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
          <div className={styles.circle}></div>
        </div>
        {text && <p className={styles.text}>{text}</p>}
      </div>
    </div>
  );
}

