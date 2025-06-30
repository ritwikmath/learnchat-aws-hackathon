"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Image from "next/image";

export default function Home() {
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChatClick = () => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      // Username exists, redirect to chat
      router.push("/chat");
    } else {
      // No username, show modal
      setShowModal(true);
    }
  };

  const handleSubmitUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsLoading(true);
      // Store username in localStorage
      localStorage.setItem("username", username.trim());
      // Redirect to chat
      router.push("/chat");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setUsername("");
  };

  return (
    <div className={styles.page}>
      {/* Header Section - 80% of window height */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            Welcome to CodeBuddy
          </h1>
          <p className={styles.subtitle}>
            Generate Unit test and Documentation for your Python code
          </p>
          <Button onClick={handleChatClick} className={styles.ctaButton}>
            Chat with Us
          </Button>
        </div>
      </header>

      {/* Cards Section */}
      <section className={styles.cardsSection}>
        <div className={styles.cardsContainer}>
          <Card
            title="Share Github File Access"
            description="Connect your GitHub repository and let us analyze your Python code to generate comprehensive unit tests and documentation."
            className={styles.card}
          />
          <Card
            title="Upload Python Code"
            description="Directly upload your Python files and we'll create detailed unit tests and documentation tailored to your codebase."
            className={styles.card}
          />
          <Card
            title="Custom Instructions"
            description="Provide specific requirements and instructions to customize the generated tests and documentation according to your project needs."
            className={styles.card}
          />
        </div>
      </section>

      {/* How Codecraft.ai Helps Section */}
      <section className={styles.helpSection}>
        <div className={styles.helpContainer}>
          <div className={styles.helpContent}>
            <h2 className={styles.helpTitle}>
              How Codecraft.ai Helps You
            </h2>
            <div className={styles.helpText}>
              <p>
                {
                  `Codecraft.ai revolutionizes your development workflow by automating the most time-consuming aspects of software development. 
                Our AI-powered platform saves you hours of manual work by generating comprehensive unit tests and detailed documentation 
                for your Python code.`
                }
              </p>
              <p>
                {
                  `By leveraging advanced machine learning algorithms, we analyze your codebase to understand its structure, dependencies, 
                and functionality. This enables us to create accurate, maintainable tests that cover edge cases you might miss, 
                and documentation that clearly explains your code's purpose and usage.`
                }
              </p>
              <p>
                {
                  `The result? More efficient coding, faster development cycles, and higher code quality. Focus on building features 
                while we handle the tedious but essential tasks of testing and documentation.`
                }
              </p>
            </div>
          </div>
          <div className={styles.helpImage}>
            <Image
              src="/coding.jpg"
              alt="Coding and development"
              width={500}
              height={400}
              className={styles.image}
            />
          </div>
        </div>
      </section>

      {/* Username Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Enter Your Username</h2>
              <button className={styles.closeButton} onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitUsername} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className={styles.input}
                  autoFocus
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !username.trim()}
                  className={styles.submitButton}
                >
                  {isLoading ? "Redirecting..." : "Start Chat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
