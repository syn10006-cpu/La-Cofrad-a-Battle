# La Cofradía Fight Night — v0.2.1

Versión enfocada en **dejar los sprites funcionales y ordenados** para seguir
construyendo el juego encima sin rehacer toda la base.

## Novedades de esta versión

- Reorganización del código en **módulos**:
  - `src/config.js`
  - `src/assets.js`
  - `src/fighter.js`
  - `src/stage.js`
  - `src/game.js`
- Sprites corregidos / consolidados como base de trabajo.
- Se agregan sprites de **victoria** para ambos personajes.
- **Pantalla de carga** con barra de progreso.
- **Pantalla de selección de personaje** antes de la pelea.
- **Pantalla de victoria** posterior al K.O.
- El personaje ganador pasa al estado de **victory animation**.
- Flujo preparado para escalar:
  - `loading -> select -> fight -> victory`

## Estado actual del combate

Implementado:

- Barra de vida.
- Caminar.
- Correr / dash.
- Salto.
- Agachar.
- Golpe débil.
- Golpe fuerte.
- Golpe agachado.
- Golpe aéreo.
- Bloqueo.
- Reacción al daño.
- K.O.
- CPU básica.

## Controles

| Acción | Tecla |
|---|---|
| Caminar | `A` / `D` |
| Correr | `Shift` + dirección |
| Correr alternativo | doble toque `A` o `D` |
| Saltar | `W` |
| Agachar | `S` |
| Golpe débil | `J` |
| Golpe fuerte | `K` |
| Bloquear | `L` |
| Confirmar en menús | `Enter` |
| Hitboxes | `H` |
| Reiniciar round | `R` |

## Cómo actualizar GitHub Pages

Como tu repo ya funciona en GitHub Pages, para actualizarlo basta con:

1. Borrar o reemplazar en la raíz del repo:
   - `assets/`
   - `src/`
   - `index.html`
   - `styles.css`
   - `README.md`
2. Subir el contenido de esta versión **directamente a la raíz**.
3. Hacer commit.
4. Esperar el nuevo deploy verde en **Actions**.

## Próximos pasos recomendados

1. Afinar todavía más algunos recortes del spritesheet si hace falta.
2. Reemplazar bloqueo por animaciones dedicadas.
3. Crear sistema de rounds (best of 3).
4. Añadir hit-stop.
5. Añadir VFX/SFX.
6. Especiales del humano y del cuy.
7. Combo / cancel windows estilo Marvel vs Capcom.

