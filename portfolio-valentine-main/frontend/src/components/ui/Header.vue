<template>
  <header 
    class="header"
    :class="{ 
      'header--scrolled': isScrolled,
      'header--mobile': mobileMenuOpen 
    }"
    >
    <div class="header-container">
      <div class="header-logo">
        <a href="/" class="header-logo__link">
          <h1 class="header-logo__icon">VA</h1>
        </a>
      </div>

      <!-- Navigation Desktop -->
      <nav class="header-nav">
        <a 
          href="/" 
          class="header-nav__link" 
          :class="{ 'active': currentPath === '/' }"
        >
          Works
        </a>
        <span>/</span>
        <a 
          href="/about" 
          class="header-nav__link" 
          :class="{ 'active': currentPath === '/about' }"
        >
          About
        </a>
      </nav>

      <!-- Mobile Menu Button -->
      <button 
        class="header-mobile-menu"
        @click="toggleMobileMenu"
        :class="{ 'active': mobileMenuOpen }"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Mobile Navigation -->
      <nav 
        class="header-nav-mobile"
        :class="{ 'header-nav-mobile--open': mobileMenuOpen }"
      >
        <a 
          href="/" 
          class="header-nav-mobile__link"
          :class="{ 'active': currentPath === '/' }"
          @click="closeMobileMenu"
        >
          Works
        </a>
        <a 
          href="/about" 
          class="header-nav-mobile__link"
          :class="{ 'active': currentPath === '/about' }"
          @click="closeMobileMenu"
        >
          About
        </a>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// États
const mobileMenuOpen = ref(false)
const isScrolled = ref(false)
const currentPath = ref('/')

// Mobile
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value

  // Empêcher le scroll du body quand le menu est ouvert
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  document.body.style.overflow = ''
}

// Lifecycle
onMounted(() => {
  currentPath.value = window.location.pathname
})

// Scroll
onMounted(() => {
  window.addEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 100
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', () => {
    isScrolled.value = window.scrollY > 100
  })
})
</script>


<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-fixed);

  &--scrolled &-logo {
    opacity: 1;
    transform: translateY(0);
    transition: opacity var(--duration-slow) var(--easing-spring), transform var(--duration-slow) var(--easing-spring);
  }

  &-container {
    max-width: var(--max-width-container);
    margin: 0 auto;
    padding: var(--spacing-5) var(--spacing-3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
  }

  &-logo {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-black);
    opacity: 0;
    transform: translateY(-20px);
    filter: blur(2.5px);
    mix-blend-mode: difference;

    position: relative;

    transition: filter var(--duration-slow) var(--easing-spring);

    &:hover {
      filter: blur(0.5px);
    }

    &__link {
      color: inherit;
      text-decoration: none;
    }
  }

  &-nav {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-2);

    &__link {
      color: inherit;
      text-decoration: none;

      font-size: var(--font-size-s);
      font-weight: var(--font-weight-black);

      position: relative;
      display: flex;
      padding: var(--spacing-2) var(--spacing-3);
      justify-content: center;
      align-items: center;

      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--color-text);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform var(--duration-slow) var(--easing-spring);
      }

      &:hover, &.active {
        &::after {
          transform: scaleX(1);
        }
      }
    }
  }

  &-mobile-menu {
    display: none;
    flex-direction: column;
    gap: var(--spacing-1);
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-2);
    margin-left: auto;
    
    .hamburger-line {
      width: var(--spacing-5);
      height: 2px;
      background: var(--color-text);
      transition: all var(--duration-slow) var(--easing-spring);
    }
    
    &.active {
      .hamburger-line {
        &:nth-child(1) {
          transform: rotate(45deg) translateY(8px);
        }
        
        &:nth-child(2) {
          opacity: 0;
        }
        
        &:nth-child(3) {
          transform: rotate(-45deg) translateY(-8px);
        }
      }
    }
  }

  &-nav-mobile {
    position: fixed;
    top: 80px;
    right: var(--spacing-3);
    background: var(--color-background);
    border: 1px solid var(--color-background-secondary);
    border-radius: var(--border-radius-m);

    padding: var(--spacing-5) var(--spacing-3);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    width: fit-content;
    min-width: 200px;

    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all var(--duration-slow) var(--easing-spring);

    z-index: var(--z-modal);

    &--open {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }

    &__link {
      color: var(--color-text);
      text-decoration: none;

      display: block;
      padding: var(--spacing-2) var(--spacing-3);
      font-size: var(--font-size-m);
      
      &.active {
        font-weight: var(--font-weight-black);
      }
    }
  }
}

@media (max-width: 768px) {
  .header {
    &-nav {
      display: none;
    }

    &-mobile-menu {
      display: flex;
    }
  }
}

</style>