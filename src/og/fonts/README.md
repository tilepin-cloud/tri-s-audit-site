# OG image fonts

resvg renders the social cards (`src/pages/og/[...path].png.ts`) from these files, so the output is identical on
every build machine. Any `.ttf` or `.otf` placed here is loaded; system fonts remain a fallback for missing glyphs.

- `Montserrat-SemiBold.ttf`, `Montserrat-Bold.ttf` — Montserrat (SIL Open Font License 1.1)
- `Inter-Regular.ttf` — Inter (SIL Open Font License 1.1)

They are not downloads: each is the Fontsource `latin`, `latin-ext` and `cyrillic` `.woff` subsets of the same
package the site already serves (`@fontsource/montserrat`, `@fontsource/inter`), merged into one TrueType file with
fontTools and given the family names `Montserrat` / `Inter`. To regenerate after a Fontsource upgrade:

```
python -m pip install fonttools
python - <<'EOF'
from fontTools.ttLib import TTFont
from fontTools.merge import Merger
import tempfile, os
jobs = {'Montserrat-SemiBold': ('montserrat', '600', 'Montserrat', 'SemiBold'),
        'Montserrat-Bold': ('montserrat', '700', 'Montserrat', 'Bold'),
        'Inter-Regular': ('inter', '400', 'Inter', 'Regular')}
tmp = tempfile.mkdtemp()
for name, (pkg, w, fam, sub) in jobs.items():
    parts = []
    for s in ('latin', 'latin-ext', 'cyrillic'):
        f = TTFont(f'node_modules/@fontsource/{pkg}/files/{pkg}-{s}-{w}-normal.woff'); f.flavor = None
        p = os.path.join(tmp, f'{pkg}-{s}-{w}.ttf'); f.save(p); parts.append(p)
    t = Merger().merge(parts); n = t['name']
    for i in (1, 2, 3, 4, 6, 16, 17): n.removeNames(nameID=i)
    n.setName(fam if sub in ('Regular', 'Bold') else f'{fam} {sub}', 1, 3, 1, 0x409)
    n.setName(sub if sub in ('Regular', 'Bold') else 'Regular', 2, 3, 1, 0x409)
    n.setName(f'{fam} {sub} og', 3, 3, 1, 0x409); n.setName(f'{fam} {sub}', 4, 3, 1, 0x409)
    n.setName(f'{fam}-{sub}', 6, 3, 1, 0x409); n.setName(fam, 16, 3, 1, 0x409); n.setName(sub, 17, 3, 1, 0x409)
    t.save(f'src/og/fonts/{name}.ttf')
EOF
```
