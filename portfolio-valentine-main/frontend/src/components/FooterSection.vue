<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <!-- Section principale -->
        <div class="footer-main">
          <div class="footer-brand">
            <h3 class="footer-title">Let's Talk</h3>
            <p class="footer-subtitle">
              Créateur d'images authentiques depuis plus de 10 ans, je développe votre image de marque avec passion.
            </p>
          </div>

          <div class="footer-contact">
            <div class="contact-links">
              <a 
                href="mailto:valentine.arnaly@hotmail.fr" 
                class="contact-link email"
                title="Envoyer un email"
              >
                valentine.arnaly@hotmail.fr
              </a>
              <a 
                href="https://instagram.com/valentine.arnaly" 
                target="_blank" 
                rel="noopener noreferrer"
                class="contact-link social"
                title="Suivre sur Instagram"
              >
                Instagram
              </a>
              <a 
                href="https://linkedin.com/in/valentine-arnaly" 
                target="_blank" 
                rel="noopener noreferrer"
                class="contact-link social"
                title="Voir le profil LinkedIn"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        <!-- Section légale -->
        <div class="footer-legal">
          <div class="footer-bottom">
            <div class="copyright">
              <span>© {{ currentYear }} Valentine Arnaly</span>
              <span class="availability">
                <span class="status-dot available"></span>
                Available for hire
              </span>
            </div>

            <div class="legal-links">
              <a href="/mentions-legales" class="legal-link">Mentions légales</a>
              <a href="/colophon" class="legal-link">Colophon</a>
              <span class="built-by">
                Built by <a href="https://buro.sh" target="_blank" rel="noopener noreferrer" class="buro-link">Buro</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Current year for copyright
const currentYear = computed(() => new Date().getFullYear())
</script>

<style lang="scss" scoped>
.footer {
  background: var(--color-black);
  color: var(--color-white);
  padding: 4rem 0 2rem;
  margin-top: 6rem;

  @media (max-width: 768px) {
    padding: 3rem 0 1.5rem;
    margin-top: 4rem;
  }
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
}

.footer-content {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

// Section principale
.footer-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

.footer-brand {
  .footer-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: var(--color-white);

    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }

  .footer-subtitle {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-gray-300);
    margin: 0;
    max-width: 400px;

    @media (max-width: 768px) {
      font-size: 0.9rem;
    }
  }
}

.footer-contact {
  display: flex;
  justify-content: flex-end;

  @media (max-width: 968px) {
    justify-content: flex-start;
  }
}

.contact-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;

  @media (max-width: 968px) {
    align-items: flex-start;
  }

  .contact-link {
    text-decoration: none;
    color: var(--color-white);
    font-size: 1rem;
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      color: var(--color-gray-300);
    }

    &.email {
      font-weight: 500;
      font-size: 1.1rem;

      &:hover {
        text-decoration: underline;
      }
    }

    &.social {
      font-weight: 400;
      text-decoration: underline;
      text-underline-offset: 4px;
      text-decoration-thickness: 1px;

      &:hover {
        text-decoration-thickness: 2px;
      }
    }
  }
}

// Section légale
.footer-legal {
  border-top: 1px solid var(--color-gray-800);
  padding-top: 2rem;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.copyright {
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 0.9rem;
  color: var(--color-gray-400);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .availability {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.available {
        background: #22c55e;
        box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        animation: pulse 2s infinite;
      }
    }
  }
}

.legal-links {
  display: flex;
  align-items: center;
  gap: 2rem;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 1rem;
  }

  .legal-link {
    color: var(--color-gray-400);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: var(--color-white);
      text-decoration: underline;
    }
  }

  .built-by {
    color: var(--color-gray-500);
    font-size: 0.8rem;

    .buro-link {
      color: var(--color-gray-400);
      text-decoration: none;
      transition: color 0.3s ease;

      &:hover {
        color: var(--color-white);
        text-decoration: underline;
      }
    }
  }
}

// Animation
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
