name: Scroll-web
description: Convierte un vídeo en una web animada premium controlada por scroll usando GSAP, renderizado de frames en canvas y coreografía de animaciones por capas.
---

# De vídeo a web premium animada por scroll

Transforma un archivo de vídeo en una experiencia web interactiva donde el **scroll controla la animación**.  
La clave es crear una **coreografía de animaciones variada**, donde diferentes tipos de movimiento trabajan juntos en lugar de repetir siempre el mismo efecto.

---

## Entrada

El usuario proporciona:

- Ruta a un archivo de vídeo (MP4, MOV, etc.)

Opcionalmente también puede indicar:

- Nombre de marca o temática
- Secciones de texto deseadas y dónde deben aparecer
- Preferencias de color
- Dirección visual o estilo de diseño

Si estos datos no se especifican, solicita información mínima o utiliza decisiones creativas razonables.

---

# Requisitos Premium (Obligatorios)

1. **Scroll suave con Lenis**  
   El scroll nativo se siente como una página web; Lenis debe hacer que se sienta como una experiencia.

2. **Mínimo 4 tipos de animación**  
   Nunca repitas el mismo tipo de entrada en dos secciones consecutivas.

3. **Revelado escalonado de contenido**  
   etiqueta → título → texto → CTA.  
   Nunca todo aparece a la vez.

4. **Nada de tarjetas glassmorphism**  
   Texto sobre fondos limpios. La jerarquía se consigue con tipografía, peso y color.

5. **Variedad de direcciones de entrada**  
   Las secciones deben aparecer desde distintos movimientos: izquierda, derecha, arriba, escala o clip.

6. **Overlay oscuro para estadísticas**  
   Opacidad entre 0.88 y 0.92.  
   Los contadores deben animarse desde 0.  
   Es la única sección donde el texto puede ir centrado.

7. **Texto horizontal gigante en movimiento**  
   Debe existir al menos un elemento tipográfico grande desplazándose con el scroll (12vw o más).

8. **Contadores animados**  
   Ningún número aparece estático: todos cuentan desde 0.

9. **Tipografía muy grande**  
   - Hero: 12rem o más  
   - Títulos de sección: 4rem o más  
   - Marquee: 10vw o más

10. **CTA persistente**  
   `data-persist="true"` mantiene visible la sección final.

11. **Hero dominante + scroll amplio**  
   El hero debe ocupar al menos el 20 % del recorrido de scroll.  
   Para 6 secciones se recomienda mínimo **800vh**.

12. **Texto siempre en los laterales**  
   Todo el contenido debe situarse en el 40 % exterior del viewport (`align-left` o `align-right`).  
   Nunca centrado, excepto en la sección de estadísticas.

13. **Revelado circular del hero**  
   El hero es una sección independiente de 100vh.  
   El canvas aparece mediante `clip-path: circle()` cuando el hero desaparece.

14. **Velocidad de frames 1.8–2.2**  
   La animación del producto debe terminar alrededor del **55 % del scroll**.  
   Menos de 1.8 se percibe lento.

---

# Flujo de procesamiento

Video (MP4) → FFMPEG → Secuencia de imágenes (WebP) → Canvas + lógica de scroll

### Por qué este enfoque

- **WebP** pesa entre 25 % y 35 % menos que JPEG con calidad similar.
- **Canvas** permite cambiar frames de forma instantánea y precisa.
- `<video>` no permite scrubbing exacto y suele provocar parpadeos.
- Canvas controlado por scroll crea una experiencia más cercana a una **web de producto premium**.

---

# Flujo de trabajo

**FFmpeg y FFprobe ya están instalados en el sistema.  
NO deben reinstalarse.**

---

## Paso 1: Analizar el vídeo

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate,nb_frames -of csv=p=0 "<VIDEO_PATH>"

Determina:
	•	resolución
	•	duración
	•	fps
	•	número total de frames

Luego decide:

Número objetivo de frames

Entre 150 y 300 frames suele dar un buen resultado.

Guía general:
	•	Vídeos cortos (<10 s): usar fps original, máximo ~300 frames
	•	Vídeos medios (10–30 s): extraer a 10–15 fps
	•	Vídeos largos (30 s+): extraer a 5–10 fps

Resolución de salida

Mantener proporción del vídeo original y limitar el ancho máximo a 1920px.

⸻

Paso 2: Extraer los frames

mkdir -p frames
ffmpeg -i "<VIDEO_PATH>" -vf "fps=<CALCULATED_FPS>,scale=<WIDTH>:-1" -c:v libwebp -quality 80 "frames/frame_%04d.webp"

Después de exportar, contar los frames:

ls frames/ | wc -l

¿Por qué WebP y no JPG?

160 frames a 1920px suelen ocupar:
	•	WebP: ~19 MB
	•	JPG equivalente: ~28 MB

Además WebP permite modo lossless si se necesita.

⸻

Paso 3: Estructura del proyecto

project-root/
  index.html
  css/style.css
  js/app.js
  frames/frame_0001.webp ...

Sin bundlers.
Solo HTML + CSS + JavaScript vanilla y librerías vía CDN.

⸻

index.html

La estructura obligatoria debe seguir este orden:

<!-- Loader -->
<!-- Header fijo -->
<!-- Hero -->
<!-- Canvas -->
<!-- Overlay oscuro -->
<!-- Marquee -->
<!-- Contenedor de scroll -->

Elementos clave:
	•	loader con progreso
	•	cabecera fija con navegación
	•	hero independiente de 100vh
	•	canvas a pantalla completa
	•	overlay oscuro
	•	textos horizontales animados
	•	secciones de contenido con rangos de scroll
	•	sección de estadísticas
	•	CTA final persistente

Scripts CDN (al final del body):

<script src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script src="js/app.js"></script>


⸻

CSS principal

Variables base:

:root {
  --bg-light: #f5f3f0;
  --bg-dark: #111111;
  --text-on-light: #1a1a1a;
  --text-on-dark: #f0ede8;
}

Distribución lateral del contenido:

.align-left { padding-left: 5vw; padding-right: 55vw; }
.align-right { padding-left: 55vw; padding-right: 5vw; }

Contenedor de scroll:

#scroll-container {
  height: 800vh;
}

Canvas sticky:

.canvas-wrap {
  position: sticky;
  top: 0;
  height: 100vh;
}


⸻

Adaptación móvil

Para pantallas menores de 768px:
	•	centrar texto
	•	overlays oscuros detrás del texto
	•	reducir altura del scroll a ~550vh
	•	usar menos de 150 frames
	•	reducir resolución a 1280px

⸻

JavaScript (app.js)

Scroll suave con Lenis

Lenis es obligatorio y debe integrarse con ScrollTrigger.

⸻

Precarga de frames

Regla crítica:

Nunca ocultar el loader hasta que todos los frames estén cargados.

La carga debe hacerse en dos fases:
	1.	cargar los primeros 10 frames inmediatamente
	2.	cargar el resto en lotes de 15–20

Esto evita saturar las conexiones del navegador.

⸻

Renderizado en Canvas

Canvas se usa porque permite cambio de frames instantáneo y preciso.

Escala recomendada:

IMAGE_SCALE 0.82 – 0.90

Esto evita que el producto se recorte contra los bordes.

También debe aplicarse devicePixelRatio para evitar blur en pantallas retina.

⸻

Sincronización scroll → frame

Regla de rendimiento:

Nunca dibujar en el canvas dentro del evento de scroll.

Separar:
	•	cálculo del frame según scroll
	•	renderizado en requestAnimationFrame

Esto evita tirones en el scroll.

⸻

Sistema de animación de secciones

Cada sección tiene:
	•	data-enter
	•	data-leave
	•	data-animation

Tipos de animación disponibles:
	•	fade-up
	•	slide-left
	•	slide-right
	•	scale-up
	•	rotate-in
	•	stagger-up
	•	clip-reveal

Nunca repetir dos iguales seguidas.

⸻

Contadores animados

Los números deben:
	•	empezar en 0
	•	animarse al entrar en viewport
	•	respetar decimales si existen

⸻

Texto horizontal animado

Los bloques .marquee-wrap deben desplazarse horizontalmente según el scroll.

⸻

Overlay oscuro

Debe activarse en un rango de scroll concreto para dar contraste a ciertas secciones.

⸻

Transición hero → canvas

El hero desaparece gradualmente mientras el canvas aparece mediante clip circular expansivo.

⸻

Testing

Para probar correctamente:

npx serve .

o

#python -m http.server 8000

Los frames deben servirse por HTTP, nunca con file://.

Verificar:
	•	scroll suave
	•	animación de frames correcta
	•	contadores funcionando
	•	marquee en movimiento
	•	overlay oscuro activándose
	•	CTA final visible

⸻

Referencia rápida de animaciones

Tipo	Estado inicial	Estado final
fade-up	y:50 opacity:0	y:0 opacity:1
slide-left	x:-80 opacity:0	x:0 opacity:1
slide-right	x:80 opacity:0	x:0 opacity:1
scale-up	scale:0.85 opacity:0	scale:1 opacity:1
rotate-in	y:40 rotation:3 opacity:0	y:0 rotation:0
stagger-up	y:60 opacity:0	y:0 opacity:1
clip-reveal	clipPath oculto	clipPath visible


⸻

Decisiones recomendadas

Tema	Correcto	Evitar
formato	WebP	JPG/PNG
reproducción	canvas	video
carga	precarga total	lazy loading
scroll	calcular estado	renderizar en scroll
render	requestAnimationFrame	scroll event
layout	sticky + contenedor alto	JS posicionando todo
frames	120-200	500+


⸻

Errores comunes
	•	cargar frames durante scroll
	•	usar el mismo tipo de animación repetidamente
	•	scroll demasiado corto
	•	render dentro del evento scroll
	•	centrar texto encima del canvas
	•	usar glassmorphism innecesario

⸻

Problemas y soluciones

Frames no cargan
La página se abre con file://.

Scroll entrecortado
Reducir frames o ajustar scrub.

Parpadeos blancos
El loader se ocultó antes de tiempo.

Canvas borroso
No se aplicó devicePixelRatio.

Animaciones que no se activan
Revisar data-enter y data-leave.

Problemas de memoria en móvil
Reducir frames y resolución.

Secciones superpuestas
Dejar margen entre rangos de scroll.
