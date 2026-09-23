# La Cofradía Battle — v0.3

Versión web lista para GitHub Pages.

## Qué cambia en v0.3

- Reemplaza completamente los sprites viejos por los nuevos personajes generados:
  - **The Biker**
  - **The Cuy Man**
- Cada frame está separado en un PNG independiente y usa el mismo canvas y baseline.
- Pantalla de carga.
- Selección de personaje.
- Peleas al mejor de 3 rondas.
- Temporizador de 60 segundos.
- Presentación `ROUND` / `FIGHT!`.
- Barra de vida.
- Golpe débil y fuerte.
- Agacharse + golpe agachado.
- Salto + ataque aéreo.
- Bloqueo.
- Caminar y correr.
- Hit reaction.
- Knockdown/K.O.
- Hit-stop básico al conectar un golpe.
- Animación y pantalla de victoria.
- CPU básica.
- Visualizador de hitboxes con `H`.

## Controles

| Acción | Tecla |
|---|---|
| Mover | A / D |
| Correr | Shift + dirección |
| Saltar | W |
| Agacharse | S |
| Golpe débil | J |
| Golpe fuerte | K |
| Bloquear | L |
| Mostrar hitboxes | H |
| Confirmar menú | Enter |
| Reiniciar combate | R |

## Estructura

```text
assets/
  characters/
    biker/
      idle/
      walk/
      run/
      jump/
      crouch/
      weak/
      strong/
      crouch_attack/
      air_attack/
      block/
      hit/
      death/
      victory/
    cuy/
      ...
  manifest.json
  preview/
  source/
src/
  config.js
  assets.js
  fighter.js
  stage.js
  game.js
index.html
styles.css
.nojekyll
```

La carpeta `assets/source/` contiene las hojas maestras solamente como referencia.
El juego usa exclusivamente los PNG individuales dentro de `assets/characters/`.

## Subir a GitHub

En tu repositorio actual reemplaza en la raíz:

- `assets/`
- `src/`
- `index.html`
- `styles.css`
- `README.md`
- `.nojekyll`

Haz commit en `main`. GitHub Pages volverá a desplegar automáticamente.
