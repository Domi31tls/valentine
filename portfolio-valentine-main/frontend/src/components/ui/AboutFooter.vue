<template>
    <footer class="footer wide-container" ref="footerRef">
        <div class="footer-content">
            <img 
                src="/uploads/about/footer.jpg" 
                alt="Valentine Arnaly Footer" 
                class="footer-image"
                loading="lazy"
                :style="{ transform: `translateY(${parallaxOffset}px)` }"
            />
        </div>
        <div class="footer-bottom">
            <div class="footer-bottom__copyright">
                <p>&copy; {{ new Date().getFullYear() }} Valentine Arnaly. All rights reserved.</p>
            </div>
            <div class="footer-bottom__legal">
                <a href="/legals">Legal Notice</a>
                <span class="footer-bottom__legal__separator">/</span>
                <a href="/colophon">Colophon</a>
            </div>
            <div class="footer-bottom__built-by">
                <p>Built by <a href="https://buro.ooo" target="_blank" rel="noopener noreferrer">Buro</a></p>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Refs
const footerRef = ref<HTMLElement | null>(null)
const parallaxOffset = ref(0)

// Parallax effect
const handleScroll = () => {
  if (!footerRef.value) return
  
  const rect = footerRef.value.getBoundingClientRect()
  const windowHeight = window.innerHeight
  
  // Calculer la position relative du footer par rapport à la viewport
  const elementCenter = rect.top + rect.height / 2
  const viewportCenter = windowHeight / 2
  
  // Calculer l'offset parallax (entre -50 et 50px)
  const distance = elementCenter - viewportCenter
  const maxOffset = 200
  const offset = Math.max(-maxOffset, Math.min(maxOffset, distance * 0.1))
  
  parallaxOffset.value = offset
}

// Setup et cleanup
onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll() // Calcul initial
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.footer {
    display: flex;
    flex-direction: column;
    padding-block: var(--spacing-6);
    gap: var(--spacing-4);

    &-content {
        width: 100%;
        aspect-ratio: 16 / 9;
        overflow: hidden;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            will-change: transform;
            transition: transform 0.1s ease-out;
        }
    }
    
    &-bottom {
        display: grid;
        width: 100%;
        grid-template-columns: 1fr 1fr 1fr;
        gap: var(--spacing-4);

        a {
            color: inherit;
        }

        &__copyright {
            justify-self: flex-start;
        }

        &__legal {
            justify-self: center;
        }

        &__built-by {
            justify-self: flex-end;
        }   
    }      
}
</style>
