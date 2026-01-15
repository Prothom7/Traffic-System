import Image from "next/image";
import styles from "./landing.module.css";
import Link from "next/link";

export default function Home() {

  return (
    <div className={styles.fullpage}>
      <main className={styles.main}>
        <Image
          src="/logo.png"
          alt="Traffic System Logo"
          width={120}
          height={120}
          className={styles.logo}
        />

        <h1 className={styles.heading}>
          Traffic System
        </h1>

        <p className={styles.description}>
          Automatically monitor vehicle number plates, detect violations, and issue fines in real-time with our intelligent traffic system.
        </p>

        <div className={styles.buttons}>
          <Link href="/authentication/signin" className={styles.getStarted}>
            Get Started
          </Link>
          <a
            href="#learn-more"
            className={`${styles.learnMore} ${""}`}
          >
            Learn More
          </a>
        </div>

        <p className={styles.footer}>
          &copy; 2026 Traffic System. All rights reserved.
        </p>
      </main>
    </div>
  );
}
