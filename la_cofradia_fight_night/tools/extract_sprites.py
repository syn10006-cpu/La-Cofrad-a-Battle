from pathlib import Path
from PIL import Image
import numpy as np

# This utility documents the exact source boxes used by prototype 0.1.
# Run from the repository root:
#   python tools/extract_sprites.py
#
# Dependency:
#   pip install pillow numpy

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "reference" / "spritesheet_definitive.jpg"
sheet = Image.open(SOURCE).convert("RGBA")

FRAMES = {'human': {'idle_0': (10, 17, 58, 82), 'idle_1': (62, 17, 108, 82), 'idle_2': (114, 17, 160, 82), 'idle_3': (166, 17, 216, 82), 'idle_4': (220, 17, 274, 82), 'walk_0': (283, 17, 329, 82), 'walk_1': (332, 17, 379, 82), 'walk_2': (378, 17, 413, 82), 'run_0': (10, 102, 75, 167), 'run_1': (76, 102, 138, 167), 'jump_0': (324, 102, 370, 167), 'jump_1': (372, 102, 413, 167), 'crouch_0': (8, 186, 72, 236), 'crouch_1': (78, 186, 138, 236), 'weak_0': (279, 254, 345, 305), 'weak_1': (345, 254, 414, 305), 'strong_0': (4, 324, 76, 374), 'strong_1': (145, 324, 220, 374), 'crouch_attack_0': (4, 393, 82, 443), 'crouch_attack_1': (82, 393, 164, 443), 'air_attack_0': (278, 393, 366, 443), 'air_attack_1': (366, 393, 470, 443), 'hit_0': (5, 728, 75, 808), 'hit_1': (78, 728, 148, 808), 'death_0': (8, 728, 75, 808), 'death_1': (208, 744, 300, 808), 'death_2': (300, 744, 396, 808)}, 'cuy': {'idle_0': (562, 17, 617, 82), 'idle_1': (625, 17, 690, 82), 'idle_2': (710, 17, 785, 82), 'walk_0': (838, 17, 887, 82), 'walk_1': (887, 17, 936, 82), 'walk_2': (936, 17, 965, 82), 'run_0': (560, 102, 625, 167), 'run_1': (625, 102, 690, 167), 'jump_0': (970, 102, 1035, 167), 'jump_1': (1035, 102, 1102, 167), 'crouch_0': (558, 186, 622, 236), 'crouch_1': (623, 186, 690, 236), 'weak_0': (558, 254, 622, 305), 'weak_1': (622, 254, 690, 305), 'strong_0': (555, 324, 690, 374), 'strong_1': (690, 324, 827, 374), 'crouch_attack_0': (558, 393, 622, 443), 'crouch_attack_1': (622, 393, 690, 443), 'air_attack_0': (830, 393, 898, 443), 'air_attack_1': (898, 393, 966, 443), 'hit_0': (558, 728, 622, 808), 'hit_1': (622, 728, 690, 808), 'death_0': (558, 728, 622, 808), 'death_1': (760, 744, 850, 808), 'death_2': (850, 744, 946, 808)}}

def remove_background(img):
    a = np.array(img.convert("RGBA"))
    r = a[:, :, 0].astype(np.int16)
    g = a[:, :, 1].astype(np.int16)
    b = a[:, :, 2].astype(np.int16)

    bg = (
        (r >= 92) & (r <= 198) &
        (g >= 108) & (g <= 212) &
        (b >= 124) & (b <= 224) &
        ((g-r) >= 5) & ((g-r) <= 34) &
        ((b-r) >= 12) & ((b-r) <= 50)
    )
    a[:, :, 3][bg] = 0
    out = Image.fromarray(a)

    alpha = np.array(out.getchannel("A"))
    ys, xs = np.where(alpha > 0)
    if len(xs):
        out = out.crop((
            max(0, int(xs.min()) - 1),
            max(0, int(ys.min()) - 1),
            min(out.width, int(xs.max()) + 2),
            min(out.height, int(ys.max()) + 2),
        ))
    return out

for character, items in FRAMES.items():
    target = ROOT / "assets" / "sprites" / character
    target.mkdir(parents=True, exist_ok=True)
    for name, box in items.items():
        remove_background(sheet.crop(box)).save(target / f"{name}.png")

print("Sprites regenerated.")
