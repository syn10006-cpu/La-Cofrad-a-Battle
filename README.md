# La Cofradía Fight Night — prototipo 0.1

Primer repositorio jugable basado en los sprites definitivos entregados y en la
referencia del cuadrilátero industrial con cadenas.

## Objetivo de esta versión

El combate es **2D lateral puro**: no existe desplazamiento hacia el fondo ni
hacia el frente. La inspiración de ritmo es *Marvel vs. Capcom*, pero esta
primera versión se limita a las bases necesarias para construir el sistema.

Implementado:

- Barra de vida para ambos personajes.
- Golpe débil.
- Golpe fuerte.
- Salto.
- Golpe aéreo.
- Agacharse.
- Golpe agachado.
- Bloqueo con daño reducido.
- Caminar.
- Correr / dash.
- Reacción al golpe.
- Animación de K.O. / muerte.
- CPU básica para el Cuy.
- Colisiones, hurtboxes y hitboxes.
- Escenario 2D inspirado en la referencia: cuadrilátero, postes, cadenas,
  público lateral y ambiente industrial.
- Modo de visualización de hitboxes para desarrollo.

## Controles

| Acción | Tecla |
|---|---|
| Caminar | `A` / `D` |
| Correr | `Shift` + dirección |
| Dash/correr alternativo | doble toque `A` o `D` |
| Saltar | `W` |
| Agacharse | `S` |
| Golpe débil | `J` |
| Golpe fuerte | `K` |
| Bloquear | mantener `L` |
| Reiniciar | `R` |
| Ver hitboxes | `H` |

Golpear con `J` o `K` durante un salto activa el golpe aéreo. Golpear mientras
se mantiene `S` activa el golpe agachado.

## Ejecutar

No tiene dependencias de runtime.

1. Descarga/clona la carpeta.
2. Abre `index.html` en Chrome, Safari, Firefox o Edge.
3. Haz clic en el canvas para darle foco al juego.

También puede servirse con cualquier servidor HTTP local, por ejemplo:

```bash
python3 -m http.server 8080
```

Luego abre `http://localhost:8080`.

## Estructura

```text
la_cofradia_fight_night/
├─ index.html
├─ styles.css
├─ src/
│  └─ game.js
├─ assets/
│  ├─ sprites/
│  │  ├─ human/
│  │  └─ cuy/
│  └─ reference/
│     ├─ spritesheet_definitive.jpg
│     └─ stage_reference.jpg
└─ tools/
   └─ extract_sprites.py
```

## Sistema de combate actual

Los ataques usan ventanas de **startup / active / recovery**. En `src/game.js`
la constante `ATTACKS` centraliza daño, alcance, frames activos y empuje.

Valores iniciales:

- Débil: 8 de daño.
- Fuerte: 15 de daño.
- Agachado: 7 de daño.
- Aéreo: 10 de daño.
- Bloqueo: recibe ~18 % del daño como chip damage.

Estos números son deliberadamente provisionales para poder ajustar el *game
feel* después de probar velocidad, hit-stop y combos.

## Sobre los sprites

Los PNG transparentes de `assets/sprites/` se extrajeron del spritesheet
definitivo. El original permanece intacto en `assets/reference/`.

El sprite etiquetado como **JUMP KICK** se usa temporalmente como golpe aéreo,
porque es la animación aérea ofensiva disponible actualmente.

Para el ataque fuerte del Cuy se utiliza la animación **HEAVY CUY BITE**.

## Próxima iteración recomendada

1. Hit-stop de 60–100 ms al conectar golpes.
2. Animaciones de bloqueo dedicadas.
3. Knockback aéreo y knockdown real.
4. Combos `débil → fuerte → launcher`.
5. Dash aéreo.
6. Input buffer y cancel windows.
7. Round system al mejor de 3.
8. Sonido y VFX.
9. Especiales definitivos de ambos personajes.
10. Sustituir el escenario dibujado por el escenario final cuando esté listo.

